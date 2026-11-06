# TrippyGo — Dokploy VPS Production Deployment Guide

This is the definitive, step-by-step production deployment manual for deploying the **TrippyGo PDF Itinerary Generator** onto a brand-new **Ubuntu VPS** using **Dokploy**.

---

## Architecture Overview

```mermaid
flowchart TD
    subgraph Client ["Client / Internet"]
        Browser["User Browser"]
    end

    subgraph VPS ["Ubuntu VPS (Host)"]
        subgraph TraefikProxy ["Dokploy Ingress (Traefik)"]
            Port443["Port 80/443 (Let's Encrypt SSL)"]
        end

        subgraph DockerCompose ["Docker Compose Stack (dokploy-network + internal-tier)"]
            WebContainer["trippygo-web (Next.js 16 Standalone)<br/>Internal Port: 3000"]
            RendererContainer["trippygo-renderer (Playwright Chromium)<br/>Internal Port: 3001 | shm_size: 2GB"]
        end
        
        DokployUI["Dokploy Control Dashboard<br/>Host Port: 3000"]
    end

    subgraph ManagedCloud ["Managed Cloud Services"]
        SupabaseDB[("Supabase PostgreSQL<br/>Supavisor IPv4 Pooler: 5432")]
        CloudflareR2[("Cloudflare R2 Bucket<br/>S3-Compatible Storage")]
        AIAPIs["AI Engines<br/>OpenAI / Gemini Flash"]
        ResendAPI["Resend Email Service"]
    end

    Browser -->|HTTPS / WSS| Port443
    Port443 -->|dokploy-network| WebContainer
    WebContainer -->|internal-tier (HTTP)| RendererContainer
    WebContainer -->|TLS 5432| SupabaseDB
    WebContainer -->|TLS S3 API| CloudflareR2
    WebContainer -->|TLS HTTPS| AIAPIs
    WebContainer -->|TLS HTTPS| ResendAPI
```

### Key Security & Architecture Highlights
1. **Host Port Protection:** Dokploy binds its own dashboard to port `3000` on the VPS host. The production compose configuration (`docker-compose.prod.yml`) **does not publish host port 3000**, avoiding port conflicts. Traefik routes public HTTPS directly to the `web` container.
2. **SSRF & Microservice Isolation:** The Playwright Chromium `renderer` container is locked to `internal-tier`. It is never exposed to the public internet or Traefik, preventing server-side request forgery (SSRF).
3. **Chromium Shared Memory:** Playwright is allocated `shm_size: "2gb"` to avoid OOM crashes during heavy multi-page PDF rendering.
4. **Zero Supplier Rate Leakage:** The Next.js standalone container strips all internal net rates and supplier costs via `computeClientView()` before passing render tokens to the renderer.

---

## Prerequisites

Before starting, prepare the following:
* **Ubuntu VPS:** Fresh instance of **Ubuntu 22.04 LTS** or **Ubuntu 24.04 LTS** (recommended: 2+ vCPUs, 4GB RAM minimum).
* **Domain Name:** A registered domain (e.g. `yourdomain.com`) with access to its DNS manager (Cloudflare, Namecheap, Route 53, etc.).
* **Supabase Project:** PostgreSQL database instance with tables created via migrations.
* **Cloudflare R2:** Bucket created with API Access Key & Secret.
* **AI API Keys:** OpenAI (`OPENAI_API_KEY`) and/or Google Gemini (`GEMINI_API_KEY`).
* **Resend API Key:** For invitation and password reset emails (optional for dev, recommended for production).

---

## Phase 1: VPS Initialization & System Hardening

Connect to your brand-new VPS via SSH as `root`:
```bash
ssh root@<YOUR_VPS_IP>
```

### 1. Update System Packages
```bash
apt update && apt upgrade -y
```

### 2. Configure 4GB Swap Space (Critical)
Next.js compiles and Docker builds can briefly spike RAM usage. On servers with 2GB–4GB RAM, building Next.js and Playwright without swap will trigger the Linux Out-Of-Memory (OOM) killer.

Execute the following commands to create and enable a persistent 4GB swapfile:
```bash
# 1. Allocate a 4GB swapfile
fallocate -l 4G /swapfile

# 2. Set strict file permissions
chmod 600 /swapfile

# 3. Format file as swap
mkswap /swapfile

# 4. Activate swap
swapon /swapfile

# 5. Make swap persistent across reboots
echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab

# 6. Optimize swappiness for servers (values 10-20 ensure RAM is preferred)
sysctl vm.swappiness=10
echo 'vm.swappiness=10' | tee -a /etc/sysctl.conf

# 7. Verify swap is active
free -h
```

### 3. Configure the Firewall (UFW)
Ensure essential ports are open before enabling the firewall:
```bash
# Allow SSH, HTTP, HTTPS, and Dokploy initial setup port
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3000/tcp

# Enable firewall
ufw --force enable
ufw status
```

---

## Phase 2: Dokploy Installation & Dashboard Setup

### 1. Run the Dokploy Automated Installer
Dokploy provides a one-line automated installer that configures Docker, Docker Swarm, Traefik, and Dokploy system containers:
```bash
curl -sSL https://dokploy.com/install.sh | sh
```
*Wait 2–4 minutes for the installation to finish.*

### 2. Access the Dokploy Dashboard
1. Open your browser and navigate to:
   ```text
   http://<YOUR_VPS_IP>:3000
   ```
2. You will be prompted to create your **Dokploy Admin Account**:
   - **Name:** Your Name
   - **Email:** your-email@yourdomain.com
   - **Password:** A strong, unique master password.
3. Log in to the Dokploy dashboard.

### 3. (Recommended) Configure Dokploy Server Domain
To access Dokploy via HTTPS instead of raw IP on port 3000:
1. In your DNS manager, add an `A` record:
   - **Type:** `A`
   - **Name:** `dokploy` (e.g. `dokploy.yourdomain.com`)
   - **Value:** `<YOUR_VPS_IP>`
   - **Proxy Status:** DNS only (gray cloud in Cloudflare).
2. In Dokploy, go to **Settings** -> **Server Domain**.
3. Enter `dokploy.yourdomain.com` and enable **Let's Encrypt SSL**.
4. Once verified, you can access your Dokploy panel securely at `https://dokploy.yourdomain.com` and close port 3000 on your firewall if desired.

---

## Phase 3: External Services Setup

### 1. Supabase Database Migration
Ensure your Supabase project tables and schemas are ready:
1. In Supabase Dashboard -> **Project Settings** -> **Database** -> **Connection string** -> Select **Node.js** or **URI**.
2. **Important:** Use the **Supavisor IPv4 Session Pooler** string (Port `5432`):
   ```text
   postgresql://postgres.<YOUR_PROJECT_REF>:<DB_PASSWORD>@aws-0-<REGION>.pooler.supabase.com:5432/postgres
   ```
3. If not already executed, run the migration in Supabase **SQL Editor**:
   - Open `src/db/migrations/0000_blue_lenny_balinger.sql` from your repository.
   - Run the script in the Supabase SQL Editor to create `itineraries`, `proposals`, `user`, `session`, `account`, `verification`, and `audit_log` tables.

### 2. Cloudflare R2 Storage Bucket
1. In the Cloudflare Dashboard, go to **R2** -> **Create bucket**.
2. Name the bucket: `trippygo-itineraries` (or `trippygo-test`).
3. Click **Manage R2 API Tokens** -> **Create API Token**:
   - Permissions: **Object Read & Write**.
   - Scope: Specific bucket (`trippygo-itineraries`) or all buckets.
4. Copy the following values:
   - **Account ID:** Found in R2 overview URL or right-hand panel.
   - **Access Key ID:** Generated API token access key.
   - **Secret Access Key:** Generated API token secret key.
   - **Endpoint URL:** `https://<YOUR_ACCOUNT_ID>.r2.cloudflarestorage.com`

---

## Phase 4: Deploying TrippyGo via Dokploy

### Step 1: Connect your Git Provider
1. In Dokploy, click **Settings** (left sidebar) -> **Git Providers**.
2. Click **Add Provider** and select **GitHub**.
3. Choose either:
   - **GitHub App** (recommended, one-click authorization).
   - **Personal Access Token (PAT)**: Create a GitHub PAT with `repo` scope and paste it here.

### Step 2: Create a Project and Compose Service
1. In the left navigation, click **Projects** -> **Create Project**.
   - **Name:** `TrippyGo`
   - **Description:** `TrippyGo Itinerary Engine & PDF Generator`
2. Open the newly created `TrippyGo` project.
3. Click **Create Service** -> Select **Compose**.
   - **Name:** `trippygo-app`
   - Click **Save**.

### Step 3: Link Repository and Specify Compose Path
1. Inside the `trippygo-app` service panel, go to the **General** tab:
2. **Source Provider:** Select `GitHub`.
3. **Repository:** Choose `your-github-username/TrippyGo-PDF-Itinerary-Generator`.
4. **Branch:** `main`
5. **Compose Path:** Enter:
   ```text
   ./docker-compose.prod.yml
   ```
   > **Why `./docker-compose.prod.yml`?**
   > This production compose file connects `web` to Dokploy's Traefik network (`dokploy-network`), leaves port 3000 unmapped on the VPS host (preventing collisions with Dokploy UI), and locks the Chromium renderer into an isolated private bridge.

6. Click **Save Changes**.

---

### Step 4: Configure Environment Variables
1. In the `trippygo-app` service panel, navigate to the **Environment** tab.
2. Generate cryptographic secrets on your local machine using terminal:
   ```bash
   # Generate BETTER_AUTH_SECRET
   openssl rand -base64 32

   # Generate INTERNAL_RENDER_SECRET
   openssl rand -hex 32
   ```
3. Copy and paste the template below into the Dokploy **Environment** editor, substituting your actual values:

```env
# ==============================================================================
# Node Runtime & URLs
# ==============================================================================
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_APP_URL=https://itinerary.yourdomain.com
BETTER_AUTH_URL=https://itinerary.yourdomain.com

# ==============================================================================
# Internal Docker Microservice Networking
# (Do NOT change these - allows container-to-container internal communication)
# ==============================================================================
INTERNAL_APP_URL=http://web:3000
RENDERER_SERVICE_URL=http://renderer:3001

# ==============================================================================
# Security & Cryptographic Tokens
# ==============================================================================
BETTER_AUTH_SECRET=PASTE_GENERATED_32_CHAR_BASE64_SECRET_HERE
INTERNAL_RENDER_SECRET=PASTE_GENERATED_32_CHAR_HEX_SECRET_HERE

# ==============================================================================
# Supabase PostgreSQL (IPv4 Session Pooler)
# ==============================================================================
DATABASE_URL=postgresql://postgres.YOUR_PROJECT_REF:YOUR_DB_PASSWORD@aws-0-YOUR_REGION.pooler.supabase.com:5432/postgres

# ==============================================================================
# Cloudflare R2 Object Storage
# ==============================================================================
S3_BUCKET=trippygo-itineraries
S3_REGION=auto
S3_ENDPOINT=https://YOUR_CLOUDFLARE_ACCOUNT_ID.r2.cloudflarestorage.com
S3_ACCESS_KEY_ID=YOUR_R2_ACCESS_KEY_ID
S3_SECRET_ACCESS_KEY=YOUR_R2_SECRET_ACCESS_KEY
S3_FORCE_PATH_STYLE=false

# ==============================================================================
# AI Extraction Engines
# ==============================================================================
OPENAI_API_KEY=sk-proj-...
GEMINI_API_KEY=AIzaSy...
GEMINI_MODEL=gemini-2.5-flash

# ==============================================================================
# Transactional Email (Resend)
# ==============================================================================
RESEND_API_KEY=re_...
EMAIL_FROM=TrippyGo Operations <operations@yourdomain.com>
```

4. Click **Save** in Dokploy.

---

### Step 5: Configure Domain & SSL Certificate (Traefik)

1. In your DNS manager (Cloudflare / Namecheap / AWS):
   - Add an **A Record**:
     - **Name:** `itinerary` (or `@` for apex domain)
     - **Value:** `<YOUR_VPS_IP>`
     - **Proxy Status:** DNS Only / Disabled (Disable Cloudflare proxy orange cloud during initial SSL issuance).
2. In Dokploy, go to the **Domains** tab of the `trippygo-app` Compose service.
3. Click **Add Domain**:
   - **Host:** `itinerary.yourdomain.com`
   - **Service:** `web` (select the `web` container from the dropdown)
   - **Container Port:** `3000`
   - **Certificate:** Toggle **Let's Encrypt (SSL)** to `Enabled`
   - **HTTPS Redirect:** `Enabled`
4. Click **Save**.

---

### Step 6: Deploy the Application

1. Go to the **Deploy** or **Overview** tab.
2. Click the **Deploy** button.
3. Click **Show Logs** to follow the live build and container startup:
   - Dokploy clones your GitHub repository.
   - Injects the environment variables to `.env`.
   - Builds `trippygo-renderer` (installs Playwright, Chromium, and brand fonts).
   - Builds `trippygo-web` (multi-stage Next.js standalone build).
   - Starts containers and executes Docker health checks (`/health`).
   - Traefik automatically issues and binds the Let's Encrypt SSL certificate.

Once complete, both containers will show green **Running / Healthy** badges!

---

## Phase 5: Post-Deployment Verification & Seeding

### 1. Seed Initial Administrator Account
You need an initial admin account to access the workbench and invite salespeople.

#### Option A: Via Dokploy Web Terminal (Recommended)
1. In Dokploy -> Compose Service `trippygo-app` -> Click on the `web` container.
2. Switch to the **Terminal** tab and click **Connect**.
3. Run the automated auth seeding script inside the container:
   ```bash
   npm run db:seed:auth
   ```
4. The terminal will output the generated administrative and advisor credentials:
   ```text
   Admin Email:     admin@trippygo.com
   Salesperson:     sales@trippygo.com
   Default Pass:    TrippyGo2026!Secure
   ```

#### Option B: From Your Local Machine
Because Supabase is a remote cloud database, you can also run the seed command locally from your development machine against your production database:
```powershell
$env:DATABASE_URL="postgresql://postgres.xxx:pass@aws-0-region.pooler.supabase.com:5432/postgres"
npm run db:seed:auth
```

---

### 2. End-to-End Operational Checklist

| Test Item | Action | Expected Result |
| :--- | :--- | :--- |
| **1. HTTPS Access** | Visit `https://itinerary.yourdomain.com` | Locks with valid Let's Encrypt SSL. Redirects to `/login`. |
| **2. Admin Login** | Sign in with `admin@trippygo.com` / `TrippyGo2026!Secure` | Successfully authenticates and lands on `/` (Workbench). |
| **3. Health Checks** | Visit `https://itinerary.yourdomain.com/health` | Returns `{"status":"healthy","uptime":...}` with HTTP 200. |
| **4. Ingestion / AI** | Upload a raw PDF itinerary via the "+ New Itinerary" button | OpenAI/Gemini extracts destinations, days, and variants accurately. |
| **5. Workbench Edit** | Adjust pricing markup, toggle GST, add or edit activities | Real-time calculations update seamlessly. |
| **6. PDF Generation** | Click **Render PDF** / **Download PDF** | Playwright Chromium renders multi-page PDF, uploads to Cloudflare R2, and initiates browser download. |
| **7. Zero Rate Leak** | Inspect the downloaded PDF text stream | **Supplier net cost is 100% absent.** Only the final selling price appears. |
| **8. Admin Cockpit** | Navigate to `/admin` | Can invite new travel advisors, view audit logs, and manage team accounts. |

---

## Phase 6: Automated CI/CD & Ongoing Maintenance

### 1. Enable Push-to-Deploy (Auto-Deploy)
1. In Dokploy -> `trippygo-app` -> **General** tab.
2. Under **Auto Deploy**, toggle **Enable Webhook**.
3. Copy the generated Webhook URL.
4. Go to your GitHub repository -> **Settings** -> **Webhooks** -> **Add webhook**:
   - **Payload URL:** Paste the Dokploy Webhook URL.
   - **Content type:** `application/json`
   - **Events:** Just the `push` event.
5. Click **Add webhook**.
*Now, every time you `git push origin main`, Dokploy will automatically rebuild and zero-downtime deploy the updated application!*

---

### 2. Routine Maintenance & Troubleshooting Commands

Connect via SSH to your VPS (`ssh root@<YOUR_VPS_IP>`):

#### View Live Production Logs
```bash
# View Web application logs
docker logs -f $(docker ps -qf "name=web")

# View Playwright renderer microservice logs
docker logs -f $(docker ps -qf "name=renderer")

# View Traefik proxy routing & SSL logs
docker logs -f dokploy-traefik
```

#### Restart Containers
```bash
# In Dokploy UI: Click "Restart" on the Compose service dashboard.
# Or via CLI inside the compose directory (/etc/dokploy/compose/<id>/code):
docker compose -f docker-compose.prod.yml restart
```

#### Free Up Disk Space (Docker Prune)
Over time, multiple Docker builds can consume disk space on your VPS. Run a weekly or monthly cleanup:
```bash
docker system prune -af --volumes
```

#### Common Troubleshooting Scenarios

* **Problem: 502 Bad Gateway when visiting domain**
  - *Fix:* Ensure the `web` container has finished booting and passed health checks. Check logs with `docker logs -f $(docker ps -qf "name=web")`. Verify that in Dokploy's **Domains** tab, the container port is set to `3000` and service is set to `web`.
* **Problem: PDF rendering fails with timeout**
  - *Fix:* Check `RENDERER_SERVICE_URL=http://renderer:3001` and `INTERNAL_APP_URL=http://web:3000` in the Dokploy Environment tab. Verify `trippygo-renderer` is healthy (`docker logs $(docker ps -qf "name=renderer")`).
* **Problem: Docker build fails with "Killed" or error code 137**
  - *Fix:* The VPS ran out of memory during compilation. Follow Phase 1 to activate the 4GB Swapfile (`swapon /swapfile`), then retry deployment.
* **Problem: S3 / Cloudflare R2 Upload errors**
  - *Fix:* Double-check `S3_ENDPOINT` format (`https://<ACCOUNT_ID>.r2.cloudflarestorage.com`), verify `S3_REGION=auto`, and ensure `S3_FORCE_PATH_STYLE=false`.

---

## Summary of Configuration Files

| File | Purpose | Location in Codebase |
| :--- | :--- | :--- |
| `docker-compose.prod.yml` | Production Docker Compose config for Dokploy (uses `dokploy-network` & `internal-tier`) | `/docker-compose.prod.yml` |
| `docker-compose.yml` | Local developer Docker Compose config with optional local DB/MinIO | `/docker-compose.yml` |
| `Dockerfile` | Multi-stage production build for Next.js 16 standalone server | `/Dockerfile` |
| `services/renderer/Dockerfile` | Headless Playwright Chromium environment with Inter & Noto fonts | `/services/renderer/Dockerfile` |
| `0000_blue_lenny_balinger.sql` | Supabase / PostgreSQL database schema migrations | `/src/db/migrations/0000_blue_lenny_balinger.sql` |
