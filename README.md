# TrippyGo — PDF Itinerary Generator

> **Internal tool for TrippyGo travel agency.** Converts raw supplier itineraries (PDF/text) into branded, print-ready client proposals using AI extraction, live image search, and automated PDF rendering.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Repository Structure](#4-repository-structure)
5. [Core Concepts & Design Decisions](#5-core-concepts--design-decisions)
6. [Environment Variables Reference](#6-environment-variables-reference)
7. [Running Locally (Development)](#7-running-locally-development)
8. [Running the Full Test Suite](#8-running-the-full-test-suite)
9. [Production Deployment](#9-production-deployment)
10. [CI/CD Pipeline](#10-cicd-pipeline)
11. [API Route Reference](#11-api-route-reference)
12. [User Roles & Access Control](#12-user-roles--access-control)
13. [Pricing & GST Logic](#13-pricing--gst-logic)
14. [Data Privacy Note](#14-data-privacy-note)
15. [Troubleshooting](#15-troubleshooting)
16. [Future Roadmap (Post v1)](#16-future-roadmap-post-v1)

---

## 1. Project Overview

TrippyGo''s sales team receives unbranded supplier PDFs (DMC quotes, WhatsApp itineraries, email text) and manually re-types them into client-facing Word documents. This tool eliminates that work:

| Step | What Happens |
|------|-------------|
| **Upload** | Salesperson uploads a supplier PDF or pastes raw text |
| **AI Extraction** | Claude AI reads it and outputs a structured JSON itinerary |
| **Review & Edit** | Two-pane editor: form on the left, live PDF preview on the right |
| **Image Picker** | Search Unsplash + Pexels per day; attribution auto-printed in PDF |
| **Markup & GST** | Enter net cost, set markup %; selling price computed in real time |
| **Generate** | Playwright renders a branded A4 PDF — no design tools needed |
| **Download / Share** | Salesperson downloads PDF or copies a pre-signed S3 link |

**Target time-to-PDF:** under 5 minutes from upload to download.

---

## 2. Architecture

```
+---------------------------------------------------------------------+
|  Browser (Sales / Admin)                                            |
|  +------------------+  +------------------------------------------+|
|  |  /itineraries    |  |  /itineraries/[id]/edit                  ||
|  |  (Dashboard)     |  |  Form Editor + Live Preview iframe       ||
|  +------------------+  +------------------------------------------+|
+----------------------------+-----------------------------------------+
                             | HTTPS
+----------------------------v-----------------------------------------+
|  Next.js 16 App (App Router)  — port 3000                          |
|                                                                     |
|  API Routes:                                                        |
|  POST /api/extract          <- Claude AI extraction                |
|  GET/PATCH /api/itineraries/[id]                                   |
|  POST /api/itineraries/[id]/generate  -> calls renderer ---+       |
|  GET  /api/images/search    <- Unsplash + Pexels            |       |
|  GET  /api/admin/settings   <- agency configuration         |       |
|  GET  /print/[id]           <- HMAC-protected print route   |       |
|                                                             |       |
|  Database: Drizzle ORM -> PostgreSQL (Neon / local Docker)  |       |
|  Storage : AWS SDK v3  -> S3 / MinIO (local fallback disk)  |       |
+-------------------------------------------------------------+-------+
                                                              | HTTP (internal)
+-------------------------------------------------------------v-------+
|  Playwright PDF Renderer Microservice  — port 3001                 |
|  Node.js + Playwright Chromium (mcr.microsoft.com/playwright)      |
|  Singleton browser | max 3 concurrent renders | shm_size 2 GB      |
|  GET  /health   POST /render                                       |
+--------------------------------------------------------------------+

External Services:
  Anthropic Claude API (claude-3-7-sonnet-20250219)
  Unsplash API          (image search + download tracking)
  Pexels API            (image search)
  AWS S3 / MinIO        (PDF + upload storage)
  PostgreSQL / Neon     (relational persistence)
```

### Key architectural choices

- **Renderer is isolated.** A Chromium crash never takes down the web app.
- **Dual render path.** `RENDERER_SERVICE_URL` set -> delegates to containerised microservice. Unset -> embedded in-process Playwright. Zero-friction local dev without Docker.
- **All money in integer paise.** Selling price is always *computed*, never stored. `computeClientView()` strips net cost before any data reaches the browser or PDF.
- **Zero-config offline fallbacks.** DB offline -> `.data/itineraries.json`. S3 offline -> `.uploads/` on local disk.

---

## 3. Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.4.3 |
| Language | TypeScript | ^5 |
| UI | React | 19.3.0 |
| Styling | Tailwind CSS v4 | ^4 |
| Schema & Validation | Zod | ^4 |
| ORM | Drizzle ORM + drizzle-kit | ^0.45.4 |
| Database | PostgreSQL | 16 |
| AI Extraction | Google Gen AI SDK (@google/genai) + Anthropic SDK | ^2.31 / ^1.3 |
| Image Search | Unsplash API + Pexels API | — |
| PDF Rendering | Playwright Chromium | ^1.64.1 |
| Storage | AWS SDK v3 (S3 / MinIO) | ^3 |
| PDF Parsing (tests) | pdf-parse | ^2.4.5 |
| Containerisation | Docker + Docker Compose | — |
| CI/CD | GitHub Actions | — |

---

## 4. Repository Structure

```
.
+-- src/
|   +-- app/                        # Next.js App Router pages & API routes
|   |   +-- page.tsx                # Dashboard / itinerary list
|   |   +-- layout.tsx
|   |   +-- globals.css
|   |   +-- health/                 # GET /health (Docker healthcheck)
|   |   +-- print/[id]/             # HMAC-protected print route (PDF template)
|   |   +-- itineraries/
|   |   |   +-- [id]/edit/          # Two-pane editor page
|   |   +-- admin/settings/         # Admin configuration UI
|   |   +-- api/
|   |       +-- extract/            # POST - AI supplier itinerary ingestion
|   |       +-- images/             # GET search, POST download tracking
|   |       +-- itineraries/        # CRUD + generate + versions + restore
|   |       +-- admin/settings/     # GET/PATCH agency settings
|   |       +-- health/             # GET /api/health
|   |       +-- storage/download/   # Local S3 fallback download
|   +-- components/
|   |   +-- editor/                 # BasicsPanel, DaysPanel, PricingPanel,
|   |                               # ImagePickerModal, TermsPanel, etc.
|   +-- lib/
|   |   +-- schema/                 # itinerary.ts (Zod), validate.ts, client-view.ts, migrate.ts
|   |   +-- extraction/             # prompt.ts, client.ts, validate-extraction.ts
|   |   +-- pricing.ts              # All money math (integer paise)
|   |   +-- pdf/render.ts           # Dual render path (service / in-process)
|   |   +-- storage/s3.ts           # S3 + local disk fallback
|   |   +-- auth/session.ts         # Session helper (shared with leads tracker)
|   |   +-- config/settings.ts      # Runtime agency configuration
|   |   +-- security/ssrf.ts        # SSRF / RFC 1918 egress guard
|   |   +-- utils/dates.ts          # Asia/Kolkata calendar engine
|   +-- db/
|   |   +-- schema.ts               # Drizzle table definitions
|   |   +-- index.ts                # DB connection (pg / Neon)
|   |   +-- migrations/             # drizzle-kit generated SQL migrations
|   +-- templates/itinerary/        # ItineraryTemplate.tsx + print.css
|   +-- middleware.ts               # Route auth guard
|
+-- services/renderer/              # Standalone PDF renderer microservice
|   +-- server.ts                   # HTTP server (Playwright)
|   +-- Dockerfile
|   +-- package.json
|
+-- scripts/                        # Dev/test scripts (run with tsx)
|   +-- test-extraction.ts          # 20-fixture extraction harness
|   +-- test-pricing-leak.ts        # PDF binary net-rate leak check
|   +-- test-pdf-fixtures.ts        # 8 visual fixture renders
|   +-- test-visual-regression.ts
|
+-- tests/
|   +-- e2e/itinerary-flow.test.ts  # Full Playwright E2E pipeline
|   +-- security/                   # API key exposure, upload, rate-limit, SSRF tests
|   +-- docker/docker-config.test.ts
|
+-- sample-itineraries/             # 20 supplier fixture files (test data)
+-- docs/DATA_PRIVACY_NOTE.md       # Anthropic data handling documentation
+-- agency-defaults.json            # Hard-coded fallback for missing .env values
+-- Dockerfile                      # Web app multi-stage build
+-- docker-compose.yml              # Full local cluster (web + renderer + db + minio)
+-- drizzle.config.ts
+-- .env.example                    # Complete env var reference (copy to .env.local)
+-- IMPLEMENTATION_PLAN.md          # Full phase-by-phase build log
```

---

## 5. Core Concepts & Design Decisions

### Money: Integer Paise

All monetary values are stored and computed as **integer paise** (1 INR = 100 paise). Rupees are produced only at display time via `formatInr(paise)`.

```
Rs 1,25,000 -> stored as 12500000 (paise)
```

This eliminates all floating-point drift. Never store partial rupees.

### Client View Projection

`computeClientView(itinerary)` strips `netAmountPaise`, `markup`, and `meta.sourceFile` before any data leaves the server to the browser or to the PDF renderer. The PDF leak test (`npm run test:leak`) enforces this in CI.

### Schema Version Migration

Every DB/file read runs `migrateItinerarySchema()` automatically. Pre-v1 JSON (raw rupees, scalar markups) is upgraded on the fly — no offline migration scripts needed.

### Print Route & HMAC Tokens

Playwright does not carry session cookies. The `/print/[id]` route is protected by a short-lived HMAC token (`INTERNAL_RENDER_SECRET`). The server generates the token, passes it as a query param, and validates it server-side before rendering.

### IST Calendar Engine

All date computations are anchored to `Asia/Kolkata` (IST, UTC+05:30). This prevents year-rollover and leap-day bugs when the server runs on UTC.

---

## 6. Environment Variables Reference

Copy `.env.example` to `.env.local` and fill in real values.

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Primary | Google AI Studio Gemini API key (https://aistudio.google.com/app/apikey) |
| `GEMINI_MODEL` | No | Direct Google model (default: `gemini-2.5-flash`, `gemini-2.5-pro`) |
| `ANTHROPIC_API_KEY` | Alternative | Direct Claude API key from console.anthropic.com (fallback) |
| `ANTHROPIC_MODEL` | No | Direct model ID (default: `claude-3-7-sonnet-20250219`) |
| `UNSPLASH_ACCESS_KEY` | Yes | Unsplash API access key |
| `PEXELS_API_KEY` | Yes | Pexels API key |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `S3_BUCKET` | Yes | Bucket name for PDFs + uploads |
| `S3_REGION` | Yes | AWS region (e.g. `ap-south-1`) |
| `S3_ACCESS_KEY_ID` | Yes | AWS / MinIO access key |
| `S3_SECRET_ACCESS_KEY` | Yes | AWS / MinIO secret key |
| `S3_ENDPOINT` | No | Set for MinIO/R2; leave empty for AWS S3 |
| `S3_FORCE_PATH_STYLE` | No | `true` for MinIO; omit for AWS |
| `RENDERER_SERVICE_URL` | No | URL of renderer microservice. If unset -> in-process Playwright |
| `INTERNAL_RENDER_SECRET` | Yes | 32+ char random string for HMAC render tokens |
| `NEXT_PUBLIC_APP_URL` | Yes | Public app URL (used in Unsplash UTM links) |
| `DEFAULT_GST_RATE` | No | e.g. `0.05` for 5% |
| `DEFAULT_SAC_CODE` | No | `998552` |
| `AGENCY_GSTIN` | No | Agency GSTIN number |
| `DEFAULT_MARKUP_PERCENT` | No | e.g. `15` |
| `MIN_MARGIN_PERCENT` | No | e.g. `8` |
| `DEFAULT_VALIDITY_DAYS` | No | e.g. `7` |

> **Never** commit real API keys. `.env.local` and `.env` are in `.gitignore`. Use GitHub Secrets for CI and your platform''s secret manager for production.

---

## 7. Running Locally (Development)

### Prerequisites

| Tool | Minimum Version | Install |
|------|----------------|---------|
| Node.js | 20 LTS | https://nodejs.org |
| npm | 10+ | bundled with Node |
| Docker Desktop | Latest | https://www.docker.com/products/docker-desktop/ |

### Option A — Full Local Stack (Recommended)

Starts the Next.js app, Playwright renderer, PostgreSQL, and MinIO all via Docker Compose.

```bash
# 1. Clone the repo
git clone <your-repo-url>
cd "PDF Itinerary Generator"

# 2. Set up environment
cp .env.example .env
# Edit .env — fill in ANTHROPIC_API_KEY, UNSPLASH_ACCESS_KEY, PEXELS_API_KEY
# Leave DATABASE_URL and S3_* as-is; they point to the local Docker services

# 3. Start all services
docker compose up --build

# 4. Run database migration (first time, or after schema changes)
docker compose exec web npx drizzle-kit migrate

# App is live at:       http://localhost:3000
# MinIO console at:     http://localhost:9001  (user: minioadmin / pass: minioadmin)
```

> **Note:** The first `docker compose up --build` pulls the Playwright Chromium image (~1.5 GB).
> Subsequent starts use Docker cache and are fast.

### Option B — Native Node.js (No Docker)

```bash
# 1. Install dependencies
npm install

# 2. Install Playwright browsers (needed for PDF rendering)
npx playwright install --with-deps chromium

# 3. Configure environment
cp .env.example .env.local
# Edit .env.local — fill in:
#   DATABASE_URL=postgresql://...
#   S3_BUCKET, S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY
#   ANTHROPIC_API_KEY, UNSPLASH_ACCESS_KEY, PEXELS_API_KEY
#   INTERNAL_RENDER_SECRET=<random 32+ char string>
#   NEXT_PUBLIC_APP_URL=http://localhost:3000
# Leave RENDERER_SERVICE_URL unset -> app uses in-process Playwright

# 4. Run database migration
npx drizzle-kit migrate

# 5. Start the development server (Turbopack hot reload)
npm run dev
# App at http://localhost:3000
```

#### Zero-infrastructure local dev

Both the database and S3 storage fall back gracefully when offline:
- **DB offline** -> data persisted to `.data/itineraries.json`
- **S3 offline** -> files stored in `.uploads/` on local disk

You can run `npm run dev` with only `ANTHROPIC_API_KEY` set and test most features.

### Starting the Renderer Microservice (standalone)

If you want the renderer as a separate process during native dev:

```bash
cd services/renderer
npm install
npx playwright install --with-deps chromium
npx tsx server.ts
# Renderer ready at http://localhost:3001
```

Then set `RENDERER_SERVICE_URL=http://localhost:3001` in `.env.local`.

---

## 8. Running the Full Test Suite

### Prerequisites

- Playwright Chromium installed: `npx playwright install --with-deps chromium`
- `INTERNAL_RENDER_SECRET` set in `.env.local` (any string >= 32 chars)

### Run all tests

```bash
npm test
```

| Command | What It Tests |
|---------|--------------|
| `npm run test:unit` | Pricing formulas (paise math, GST modes, rounding, Indian number format), schema migration (v0->v1, rupee normalisation) |
| `npm run test:dates` | IST calendar engine: year rollover, leap day, 1-night trip, quote expiry |
| `npm run test:security` | API key exposure scan, upload validation (size + MIME + spoofed header), rate-limit HTTP 429, SSRF egress blocking |
| `npm run test:docker` | Docker Compose config audit: healthcheck definitions, resource limits |
| `npm run test:leak` | Renders PDF with known net rate; parses binary stream; asserts zero leakage |
| `npm run test:visual` | Renders 8 fixture PDFs; compares pixel diff against reference screenshots |
| `npm run test:e2e` | Full Playwright E2E: upload -> AI extraction -> markup/GST -> image -> generate -> download -> binary leak check |

### Run individual suites

```bash
npm run test:unit          # Fast, no browser needed (~3 s)
npm run test:dates         # Fast (~1 s)
npm run test:security      # Fast (~5 s)
npm run test:docker        # Fast (~2 s)
npm run test:extraction    # 20-fixture extraction harness (~30 s with API)
npm run test:leak          # Renders one PDF, parses it (~10 s)
npm run test:visual        # Renders 8 PDFs (~60 s)
npm run test:e2e           # Full browser + PDF pipeline (~90 s)
```

### Extraction test harness

```bash
npm run test:extraction
```

Runs all 20 sample supplier itineraries through the full extraction pipeline and scores:
day count accuracy, net price extraction, hotel name detection, cancellation row count, and Zod schema compliance.
**Baseline: 100% schema validity, 91.0% average quality score.**

> Without `ANTHROPIC_API_KEY`, the offline heuristic parser runs. Full scores require live Claude API access.

---

## 9. Production Deployment

### Option A — Docker Compose on a VPS / VM (Recommended for small teams)

Minimum server spec: **4 vCPU, 8 GB RAM** (renderer needs 4 GB + 2 GB shm).

#### 1. Server setup

```bash
# Ubuntu 22.04 / Debian 12
sudo apt-get update
sudo apt-get install -y docker.io docker-compose-plugin
sudo usermod -aG docker $USER && newgrp docker
```

#### 2. Clone and configure

```bash
git clone <your-repo-url> /opt/trippygo
cd /opt/trippygo

cp .env.example .env
nano .env   # Fill in all real values
```

**Critical values to change for production:**

```env
NODE_ENV=production
DATABASE_URL=postgresql://trippygo:<STRONG_PASSWORD>@db:5432/trippygo
INTERNAL_RENDER_SECRET=<openssl rand -hex 32>
NEXT_PUBLIC_APP_URL=https://your-domain.com
ANTHROPIC_API_KEY=sk-ant-api03-...real...
UNSPLASH_ACCESS_KEY=...real...
PEXELS_API_KEY=...real...

# AWS S3 (instead of MinIO):
S3_BUCKET=trippygo-itineraries-prod
S3_REGION=ap-south-1
S3_ACCESS_KEY_ID=AKIA...
S3_SECRET_ACCESS_KEY=...
# Leave S3_ENDPOINT empty for AWS S3
```

#### 3. Harden docker-compose.yml for production

- Change `db` service `POSTGRES_PASSWORD` to match your `.env`.
- Remove external `ports:` mappings for `db` and `minio` (no direct internet exposure).

#### 4. Build and start

```bash
docker compose build
docker compose up -d

# Run DB migration (first deploy only, or after schema changes)
docker compose exec web npx drizzle-kit migrate

# Verify all services are healthy
docker compose ps
curl http://localhost:3000/health
curl http://localhost:3001/health
```

#### 5. Nginx reverse proxy + TLS

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate     /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    client_max_body_size 15M;

    location / {
        proxy_pass         http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_set_header   Upgrade           $http_upgrade;
        proxy_set_header   Connection        "upgrade";
        proxy_read_timeout 120s;
    }
}
```

Get TLS certificate: `sudo certbot --nginx -d your-domain.com`

#### 6. Database management

```bash
# Backup
docker compose exec db pg_dump -U trippygo trippygo > backup_$(date +%Y%m%d).sql

# Restore
cat backup_20261024.sql | docker compose exec -T db psql -U trippygo trippygo

# Run migration after code update
git pull
docker compose build web
docker compose exec web npx drizzle-kit migrate
docker compose up -d web
```

### Option B — Railway / Fly.io (Fastest to deploy)

**Railway:**
1. Connect your GitHub repo in the Railway dashboard.
2. Railway auto-detects `Dockerfile` and builds the web app.
3. Add a second service pointing to `./services/renderer/Dockerfile`.
4. Add a Railway PostgreSQL plugin.
5. Set all env vars in the Railway *Variables* tab.
6. Set `RENDERER_SERVICE_URL` to the Railway-internal URL of the renderer service.

**Fly.io:**
```bash
fly auth login
fly launch --no-deploy
fly secrets set ANTHROPIC_API_KEY=... INTERNAL_RENDER_SECRET=...
fly deploy
```

> On Fly.io, use `fly postgres create` for the database and `fly volumes create` for persistent storage.

### Option C — AWS ECS / GCP Cloud Run (Scale-out)

Deploy each container as a separate ECS task or Cloud Run service. The renderer's `shm_size: 2gb` requirement maps to `linuxParameters.sharedMemorySize: 2048` in ECS task definitions.

Use **Amazon RDS PostgreSQL** and **AWS S3 (ap-south-1)** for managed persistence.

### Production deployment checklist

- [ ] All API keys set (not placeholders from `.env.example`)
- [ ] `INTERNAL_RENDER_SECRET` is >= 32 random bytes (`openssl rand -hex 32`)
- [ ] `NODE_ENV=production`
- [ ] DB password is strong (not `localdev`)
- [ ] `ports:` for `db` and `minio` removed (no external exposure)
- [ ] HTTPS/TLS configured on reverse proxy
- [ ] `NEXT_PUBLIC_APP_URL` set to the real public domain
- [ ] `drizzle-kit migrate` run against production DB
- [ ] `docker compose ps` shows all services as `healthy`
- [ ] End-to-end smoke test: upload a supplier PDF, generate and download a PDF
- [ ] Automated daily DB backup configured
- [ ] Unsplash production API approval submitted (1,000 req/hr)

---

## 10. CI/CD Pipeline

### `.github/workflows/ci.yml` — triggers on every push and PR to `main`

```
Lint -> TypeScript strict check -> Unit tests -> Date tests -> Security tests
-> Extraction harness (20 fixtures) -> PDF leak test
-> Visual regression -> E2E Playwright -> Docker build validation (dry run)
```

All jobs run on `ubuntu-latest`. CI uses `concurrency` groups to cancel in-progress runs on new pushes.

### `.github/workflows/deploy.yml` — triggers on merge to `main`

```
Run drizzle-kit migrate (production DB)
-> Build web + renderer Docker images
-> Push to GitHub Container Registry (ghcr.io)
-> Trigger production deployment webhook
```

### Required GitHub Secrets

Set in **Settings -> Secrets and variables -> Actions**:

| Secret | Value |
|--------|-------|
| `ANTHROPIC_API_KEY` | Live Claude API key |
| `UNSPLASH_ACCESS_KEY` | Unsplash API key |
| `PEXELS_API_KEY` | Pexels API key |
| `DATABASE_URL` | Production PostgreSQL connection string |
| `S3_BUCKET` | Production S3 bucket name |
| `S3_REGION` | AWS region |
| `S3_ACCESS_KEY_ID` | AWS IAM access key |
| `S3_SECRET_ACCESS_KEY` | AWS IAM secret key |
| `INTERNAL_RENDER_SECRET` | 32+ char random string |
| `NEXT_PUBLIC_APP_URL` | Production URL |
| `GHCR_TOKEN` | GitHub PAT with `write:packages` scope |

---

## 11. API Route Reference

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `POST` | `/api/extract` | session | Upload supplier PDF/text; run AI extraction; return structured JSON |
| `GET` | `/api/itineraries` | session | List itineraries (own for sales; all for admin) |
| `POST` | `/api/itineraries` | session | Create a new itinerary |
| `GET` | `/api/itineraries/[id]` | session | Fetch itinerary (client view — no net price) |
| `PATCH` | `/api/itineraries/[id]` | session | Autosave current editor state |
| `POST` | `/api/itineraries/[id]/generate` | session | Render PDF; create version row; return download link |
| `GET` | `/api/itineraries/[id]/versions` | session | List versions with pre-signed PDF URLs (1-hr expiry) |
| `POST` | `/api/itineraries/[id]/versions/[n]/restore` | session | Restore editor to a historical version snapshot |
| `GET` | `/api/images/search` | session | Parallel Unsplash + Pexels image search (10-min cache) |
| `POST` | `/api/images/download` | session | Trigger Unsplash download tracking on photo selection |
| `GET` | `/api/admin/settings` | **admin** | Read agency runtime configuration |
| `PATCH` | `/api/admin/settings` | **admin** | Update markup, GST, GSTIN, rounding, validity, etc. |
| `GET` | `/api/storage/download` | session | Local-fallback PDF download (dev/staging only) |
| `GET` | `/api/health` | public | Returns `{ status: "ok" }` — Docker healthcheck |
| `GET` | `/print/[id]` | HMAC token | Server-rendered HTML for Playwright PDF renderer |
| `GET` | `/health` | public | Alias healthcheck route |

---

## 12. User Roles & Access Control

| Capability | `sales` | `admin` |
|-----------|:-------:|:-------:|
| Upload supplier itinerary | Yes | Yes |
| Create / edit own itineraries | Yes | Yes |
| View all salespeople''s itineraries | No | Yes |
| Pick images, generate PDFs | Yes | Yes |
| Override markup per itinerary | 8-30% | Any |
| View net cost / margin in editor | Yes | Yes |
| Access `/admin/settings` | No | Yes |
| View full version audit trail | No | Yes |

Session cookie: `trippygo_session`. Shared session contract with the TrippyGo leads tracker:

```typescript
{ id: string, name: string, email: string, phone: string, role: "admin" | "sales" }
```

---

## 13. Pricing & GST Logic

All computation is in `src/lib/pricing.ts` — pure functions, zero side effects.

### Calculation flow

```
Net Amount (paise)
  -> + Markup (percent or flat, in paise)
  -> = Pre-rounding Selling Price
  -> Apply rounding rule (nearest Rs 1 / Rs 50 / Rs 100)
  -> = Selling Price
  -> Compute GST (based on mode)
  -> Output PricingBreakdown
```

### GST modes

| Mode | Behaviour | PDF display |
|------|-----------|------------|
| `inclusive` | GST backed out of selling price | "5% GST Inclusive (Rs X,XXX)" |
| `extra` | GST added on top of selling price | Base price + GST line + total + SAC 998552 |
| `hidden` | All-inclusive, no GST line | Statutory disclosure only |

### Traveller pricing units

| Type | Unit | % of Adult Price |
|------|:----:|:----------------:|
| Adult | 1.0 | 100% |
| Child with bed | 0.70 | 70% |
| Child without bed | 0.40 | 40% |
| Infant | 0.00 | Free |

### TCS (Tax Collected at Source)

When enabled in admin settings, a distinct statutory line is printed on the PDF:
*"TCS @ applicable rates under Sec 206C to be collected separately"*
This is never folded into the GST calculation.

---

## 14. Data Privacy Note

See `docs/DATA_PRIVACY_NOTE.md` for full details.

**Summary:** Under Anthropic''s Commercial API Terms, customer prompts and supplier itinerary inputs are **never used to train models** by default. API data is retained for up to 30 days for safety monitoring only. Zero Data Retention (ZDR) is available on request for enterprise plans.

The agency should review and sign off on this before processing real client/supplier data through the extraction API.

---

## 15. Troubleshooting

### PDF generation fails silently

1. Check `docker compose logs renderer` for Chromium errors.
2. Confirm `shm_size: "2gb"` is in `docker-compose.yml` for the renderer service.
3. Verify `INTERNAL_RENDER_SECRET` is identical in both web and renderer environments.
4. Check renderer health: `curl http://localhost:3001/health`

### Chromium crashes with ERR_INSUFFICIENT_RESOURCES

The renderer is running out of shared memory. Ensure `shm_size: "2gb"` is in Docker Compose. This affects large, image-heavy itineraries (10+ days).

### `drizzle-kit migrate` fails

Verify `DATABASE_URL` is reachable. Inside Docker Compose use:
`docker compose exec web npx drizzle-kit migrate`
The connection string must use the internal Docker hostname (`db`), not `localhost`.

### Images appear blank in generated PDF

The readiness probe waits for all images to load before toggling `meta[name=ready]` to `"true"`. If images fail (network error, hotlink block), the PDF captures early. Check:
- Image CDN URLs reachable from inside the renderer container.
- Unsplash/Pexels URLs not blocked by egress firewall rules.

### Net price appears in generated PDF

This should never happen; the PDF leak test catches it in CI. If seen locally:
1. Run `npm run test:leak` — it shows exactly which string leaked and on which page.
2. Ensure `computeClientView()` is called before passing data to `ItineraryTemplate`.
3. Confirm `netAmountPaise` and `markup` are not present in React props to the print route.

### S3 uploads fail in development

Storage auto-falls-back to `.uploads/` on disk. To use MinIO:
1. Start it: `docker compose up minio`
2. Create bucket: open `http://localhost:9001` (minioadmin / minioadmin) -> Create Bucket -> `trippygo-itineraries`
3. Set `S3_ENDPOINT=http://localhost:9000` and `S3_FORCE_PATH_STYLE=true` in `.env.local`

### Extraction returns empty or low-quality result

- Without `ANTHROPIC_API_KEY`, the offline heuristic parser runs (lower quality by design).
- With the key, low scores mean the prompt needs tuning. Run `npm run test:extraction` to see which fields are failing across the 20-fixture harness, then adjust `src/lib/extraction/prompt.ts`.

---

## 16. Future Roadmap (Post v1)

Parked — do not scope into v1.

- **Lead-to-quote link** — create itinerary from a leads tracker record; attach PDF to lead on send
- **Shareable web version** — same template served as a private link with view tracking
- **Saved package templates** — clone past itineraries; reusable route templates
- **Own image library** — agency uploads and tags its own destination photos
- **Option comparison** — 2-3 hotel-tier variants in one PDF
- **Email / WhatsApp delivery** — send directly from app
- **Client approval flow** — comments on the web version
- **Hindi & regional languages** — Devanagari font in Docker image; Intl RTL support
- **Supplier rate cards** — auto-fill net price from stored rate table
- **AI description polishing** — Claude rewrites supplier text in agency tone (always suggestion, never auto-applied)

---

## License

Internal proprietary software. All rights reserved — TrippyGo, 2026.

---

*Last updated: October 2026. See IMPLEMENTATION_PLAN.md for the full phase-by-phase build log.*
