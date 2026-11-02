# TrippyGo — PDF Itinerary Generator

> **Enterprise B2B Itinerary Engine for TrippyGo Travel Agency.**  
> Transforms unstructured supplier quotes (PDFs, WhatsApp chats, DMC emails) into bespoke, print-ready client proposals in under 5 minutes using AI extraction, intelligent flight routing, and automated Chromium PDF rendering.

[![Next.js 16](https://img.shields.io/badge/Next.js-16.4.3-black?logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.3.0-blue?logo=react)](https://react.dev/)
[![Tailwind v4](https://img.shields.io/badge/Tailwind-v4.0-38bdf8?logo=tailwind-css)](https://tailwindcss.com/)
[![Playwright](https://img.shields.io/badge/Playwright-Chromium-green?logo=playwright)](https://playwright.dev/)
[![TypeScript 5](https://img.shields.io/badge/TypeScript-5.0-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle-ORM-C5F74F?logo=drizzle)](https://orm.drizzle.team/)

---

## Table of Contents

1. [The Ideation & Philosophy](#1-the-ideation--philosophy)
2. [Core Feature Highlights](#2-core-feature-highlights)
3. [System Architecture Overview](#3-system-architecture-overview)
4. [Technology Stack](#4-technology-stack)
5. [Environment Variables Reference](#5-environment-variables-reference)
6. [Development Setup (Local)](#6-development-setup-local)
   - [Option A: Native Node.js (Zero Infrastructure)](#option-a--native-nodejs-zero-infrastructure-recommended)
   - [Option B: Full Docker Compose Cluster](#option-b--full-docker-compose-cluster)
7. [Production Deployment Guide](#7-production-deployment-guide)
   - [Hardware Requirements](#hardware-requirements)
   - [Step-by-Step VPS / Server Deployment](#step-by-step-vps--server-deployment)
   - [Nginx Reverse Proxy & SSL Configuration](#nginx-reverse-proxy--ssl-configuration)
   - [Production Security Checklist](#production-security-checklist)
8. [Testing Suite & Quality Verification](#8-testing-suite--quality-verification)
9. [Repository Structure](#9-repository-structure)
10. [Further Documentation](#10-further-documentation)

---

## 1. The Ideation & Philosophy

### The Real-World Agency Problem
In modern travel sales operations, speed and aesthetics win deals. However, travel sales advisors face significant operational friction:
1. **Unstructured Supplier Quotations:** Suppliers and Destination Management Companies (DMCs) deliver quotes in chaotic formats: unstructured WhatsApp messages, scanned PDF price sheets, or dense email threads.
2. **Painful Manual Re-Typing:** Sales advisors historically spend 30–60 minutes re-typing day-by-day details, flight times, and hotel inclusions into Microsoft Word templates.
3. **The "AI Slop" Trap:** Generic AI tools typically output ugly, SaaS-style dashboards dumped onto paper: outline icon bloat, neon pill badges, generic Inter sans-serif text, and floating bordered boxes.
4. **Commercial Net Rate Leakage Risk:** Manually calculating markups on client-facing proposals introduces catastrophic risks of accidentally leaking DMC supplier net rates, phone numbers, or internal pricing formulas to clients.

### The TrippyGo Solution
TrippyGo re-engineers this workflow into an **Executive Itinerary Workbench** capable of outputting a luxury proposal in **under 5 minutes**:

```
[Raw Supplier Quote] ────> [AI Extraction] ────> [Split-Screen Editor] ────> [A4 PDF Generation]
  • WhatsApp text            • Gemini / Claude     • Flight routing             • Headless Chromium
  • DMC Price PDF            • Structured JSON     • Unsplash stock photos      • Print CSS3
  • Supplier email           • Zero-leak checks    • Indian GST & markup        • S3 storage link
```

### Core Design Principles (Impeccable Standard)
- **Bespoke Editorial Luxury:** Visual identity inspired by *Condé Nast Traveler* and *Kinfolk*. High-contrast editorial serifs (**Cormorant Garamond**) paired with architectural sans (**Plus Jakarta Sans**), printed on warm ivory canvas (`#fafaf7`) with deep structural navy (`#091c3e`) and restrained heritage red (`#c92229`).
- **Whitespace Over Boxes:** Zero nested cards or lazy containers. Content breathes naturally through delicate hairline dividers (`#e2e8f0`).
- **Zero Net Rate Leak Guarantee:** `computeClientView()` mathematically strips supplier net costs and internal metadata before any payload leaves the server.
- **Operate Mode Workbench:** The home interface is an operations cockpit with instant search (`Cmd+K`), proposal tracking, pipeline metrics, and a distraction-free intake modal.

---

## 2. Core Feature Highlights

- **Multi-LLM Ingestion Pipeline:** Uses Google Gemini (`gemini-2.5-flash`), Anthropic Claude (`claude-3-7-sonnet-20250219`), or OpenAI (`gpt-4o-mini`) with automatic offline heuristic fallback.
- **Journey-First Flight Engine:** Automatically groups flight sectors into **Outbound** and **Return** journeys, auto-infers flight directions, resolves airport metadata from 60+ global hubs, and handles cross-midnight layovers with exact clock precision.
- **Editorial Boarding Pass Tickets:** Renders flights as authentic airline tickets with perforated stubs, IATA codes, and luggage allowances.
- **Commercials & Indian Tax Engine:** Integer-paise precision arithmetic, SAC 998552 tour operator compliance, 5% inclusive/extra GST modes, Section 206C TCS disclaimers, and 8% minimum margin safety alerts.
- **Curated Stock Photography:** Live in-editor search across Unsplash and Pexels with automatic photographer attributions printed on client proposals.
- **Dual-Path PDF Engine:** Microservice-isolated Chromium renderer with in-process local development fallback.

---

## 3. System Architecture Overview

TrippyGo separates the high-frequency interactive Next.js web application from the memory-heavy PDF rendering engine:

```
+-----------------------------------------------------------------------+
|  BROWSER CLIENT (Sales Operations)                                    |
|  - Executive Workbench Dashboard (/)                                  |
|  - Two-Pane Interactive Editor (/itineraries/[id]/edit)               |
|  - Agency Commercial Settings (/admin/settings)                       |
+-----------------------------------------------------------------------+
                                   | HTTPS
+----------------------------------v------------------------------------+
|  NEXT.JS 16 APP ROUTER (Port 3000)                                    |
|                                                                       |
|  API Endpoints:                                                       |
|  • POST /api/extract             <- Gemini / Claude AI Extraction     |
|  • GET/POST /api/itineraries     <- Proposal Listing & Creation       |
|  • GET/DELETE /api/itineraries/[id]                                   |
|  • POST /api/itineraries/[id]/generate -> Calls PDF Renderer          |
|  • GET  /print/[id]              <- Cryptographic HMAC Print Route    |
|                                                                       |
|  Persistence Abstraction:                                             |
|  • Relational DB: Drizzle ORM -> PostgreSQL 16 (Neon / VPS)           |
|    (Transparent fallback to .data/itineraries.json when DB offline)   |
|  • Storage: AWS S3 SDK v3 -> AWS S3 / MinIO                           |
|    (Transparent fallback to .uploads/ on local disk when S3 offline)  |
+-----------------------------------------------------------------------+
                                   | HTTP (HMAC-Authenticated)
+----------------------------------v------------------------------------+
|  STANDALONE PLAYWRIGHT CHROMIUM RENDERER (Port 3001)                  |
|  • Containerised Chromium (mcr.microsoft.com/playwright)              |
|  • Memory-isolated: 2 GB shared memory (/dev/shm), max 3 workers      |
|  • Process Isolation: Chromium crash cannot crash the web service     |
+-----------------------------------------------------------------------+
```

> 📖 **Deep Technical Details:** Read [ARCHITECTURE.md](file:///c:/programming-files/WEB-DEV/TrippyGo/TrippyGo-PDF-Itinerary-Generator/ARCHITECTURE.md) for full subsystem breakdowns, data flow diagrams, security threat models, and schema migration mechanics.

---

## 4. Technology Stack

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Framework** | Next.js (App Router) | `16.4.3` | React Server Components, API routes, Turbopack |
| **Runtime / UI** | React / React DOM | `19.3.0` | Modern hooks, transitions, and concurrent rendering |
| **Language** | TypeScript | `^5` | Full-stack strict type safety |
| **Styling** | Tailwind CSS | `^4.0` | Token-driven CSS, print stylesheets, zero runtime CSS |
| **Database** | PostgreSQL + Drizzle ORM | `pg ^8.23`, `drizzle ^0.45` | Relational persistence with instant schema migrations |
| **Authentication** | Better Auth + Drizzle Adapter | `better-auth ^1.7` | Role-based access control, session security, anti-probing |
| **Transactional Email** | Resend SDK | `resend ^6.37` | Staff invitations and password reset flows with dev fallback |
| **AI Extraction** | Google Gen AI + Anthropic SDK | `@google/genai`, `@anthropic-ai/sdk` | Structured document parsing |
| **PDF Rendering** | Playwright Chromium | `^1.64.1` | Headless print rendering to exact A4 dimensions |
| **Object Storage** | AWS S3 SDK v3 | `@aws-sdk/client-s3` | Storing rendered client PDFs and uploaded supplier files |
| **Typography** | Self-Hosted Web Fonts | Cormorant Garamond, Plus Jakarta Sans, Caveat | Deterministic, offline rendering |

---

## 5. Environment Variables Reference

Copy `.env.example` to `.env.local` for local development or `.env` for production:

```bash
cp .env.example .env.local
```

| Variable | Required | Default / Example | Purpose |
| :--- | :---: | :--- | :--- |
| `GEMINI_API_KEY` | **Primary** | `AIzaSy...` | Google Gemini API key for structured itinerary parsing |
| `GEMINI_MODEL` | No | `gemini-2.5-flash` | Gemini model name |
| `ANTHROPIC_API_KEY` | Alternative | `sk-ant-api03-...` | Anthropic Claude API key (secondary fallback) |
| `ANTHROPIC_MODEL` | No | `claude-3-7-sonnet-20250219` | Claude model name |
| `OPENAI_API_KEY` | Alternative | `sk-...` | OpenAI API key (tertiary fallback) |
| `DATABASE_URL` | No* | `postgresql://user:pass@localhost:5432/trippygo` | PostgreSQL connection string (*falls back to local JSON) |
| `S3_BUCKET` | No* | `trippygo-itineraries` | S3 bucket for PDF storage (*falls back to local disk) |
| `S3_REGION` | No | `ap-south-1` | AWS region |
| `S3_ACCESS_KEY_ID` | No | `AKIA...` | AWS or MinIO Access Key |
| `S3_SECRET_ACCESS_KEY` | No | `...` | AWS or MinIO Secret Key |
| `S3_ENDPOINT` | No | `http://localhost:9000` | Leave empty for AWS; set for MinIO or Cloudflare R2 |
| `INTERNAL_RENDER_SECRET` | **Yes** | `(random 32+ char string)` | Cryptographic secret for signing HMAC print tokens |
| `BETTER_AUTH_SECRET` | **Yes** | `(random 32+ char string)` | Cryptographic secret for signing user session tokens |
| `BETTER_AUTH_URL` | **Yes** | `http://localhost:3000` | Canonical auth base URL |
| `RESEND_API_KEY` | Optional | `re_...` | Resend API key for transactional emails (falls back to terminal) |
| `EMAIL_FROM` | No | `TrippyGo <operations@trippygo.com>` | Sender address for team invites & password resets |
| `RENDERER_SERVICE_URL` | No | `http://localhost:3001` | Microservice URL. If omitted, uses embedded Chromium |
| `NEXT_PUBLIC_APP_URL` | **Yes** | `http://localhost:3000` | Canonical app URL |
| `UNSPLASH_ACCESS_KEY` | No | `...` | Stock photography search |
| `PEXELS_API_KEY` | No | `...` | Secondary photo provider |

---

## 6. Development Setup (Local)

### Prerequisites
- **Node.js:** `v20.x` or `v22.x` (LTS)
- **Package Manager:** `npm 10+`
- **Optional:** Docker Desktop (if using full container cluster)

---

### Option A: Native Node.js (Zero Infrastructure) [RECOMMENDED]

TrippyGo supports **zero-infrastructure local development**. If PostgreSQL or S3 are not running, the application automatically persists itineraries to `.data/itineraries.json` and files to `.uploads/`.

```bash
# 1. Clone repository
git clone <repo-url>
cd trippygo-pdf-itinerary-generator

# 2. Install dependencies
npm install

# 3. Install Playwright Chromium (needed for local PDF rendering)
npx playwright install --with-deps chromium

# 4. Configure local environment
cp .env.example .env.local
# Open .env.local and add at least:
# - GEMINI_API_KEY (or ANTHROPIC_API_KEY)
# - INTERNAL_RENDER_SECRET=dev-secret-key-must-be-at-least-32-characters-long
# - NEXT_PUBLIC_APP_URL=http://localhost:3000

# 5. Seed initial admin & salesperson accounts
npm run db:seed:auth

# 6. Start development server with Turbopack hot reload
npm run dev
```

Visit **`http://localhost:3000`** in your browser. The executive workbench will load with sample itineraries.

---

### Option B: Full Docker Compose Cluster

Runs the complete containerized stack: Next.js Web App, Isolated Playwright Renderer, PostgreSQL 16 database, and MinIO S3 object store.

```bash
# 1. Configure environment
cp .env.example .env
# Fill in your AI keys (GEMINI_API_KEY or ANTHROPIC_API_KEY) in .env

# 2. Spin up all containers
docker compose up --build

# 3. Apply database migrations (first launch only)
docker compose exec web npx drizzle-kit migrate

# 4. Seed admin and salesperson accounts
docker compose exec web npm run db:seed:auth
```

- **Web App:** `http://localhost:3000`
- **Renderer Microservice:** `http://localhost:3001`
- **MinIO S3 Console:** `http://localhost:9001` (User: `minioadmin`, Pass: `minioadmin`)

---

## 7. Production Deployment Guide

### Hardware Requirements
- **Server:** Linux VPS (Ubuntu 22.04 LTS or Debian 12 recommended)
- **Minimum Specifications:** 4 vCPU, 8 GB RAM (Playwright Chromium requires at least 2 GB `/dev/shm` and 4 GB RAM during active render bursts)
- **Storage:** 50 GB NVMe SSD

---

### Step-by-Step VPS / Server Deployment

#### 1. System Preparation & Docker Installation
```bash
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -y docker.io docker-compose-plugin nginx certbot python3-certbot-nginx
sudo usermod -aG docker $USER
```

#### 2. Deploy Application Files
```bash
git clone <repo-url> /opt/trippygo
cd /opt/trippygo

# Create production environment file
cp .env.example .env
nano .env
```

**Production `.env` configuration:**
```env
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://itineraries.youragency.com
INTERNAL_RENDER_SECRET=generate_with_openssl_rand_hex_32

# Production Database (Neon or Managed Postgres)
DATABASE_URL=postgresql://trippygo_user:STRONG_PASSWORD@db_host:5432/trippygo?sslmode=require

# Production AWS S3
S3_BUCKET=trippygo-proposals-production
S3_REGION=ap-south-1
S3_ACCESS_KEY_ID=AKIA...
S3_SECRET_ACCESS_KEY=...
# Leave S3_ENDPOINT empty for native AWS S3

# AI Extraction Credentials
GEMINI_API_KEY=AIzaSy...
ANTHROPIC_API_KEY=sk-ant-api03-...

# Service Discovery
RENDERER_SERVICE_URL=http://renderer:3001
```

#### 3. Build & Launch Containers
```bash
# Build multi-stage standalone Next.js image and renderer image
docker compose build --no-cache

# Start in background
docker compose up -d

# Execute database migrations
docker compose exec web npx drizzle-kit migrate

# Verify containers are healthy
docker compose ps
curl http://localhost:3000/health
curl http://localhost:3001/health
```

---

### Nginx Reverse Proxy & SSL Configuration

Create `/etc/nginx/sites-available/trippygo`:

```nginx
server {
    listen 80;
    server_name itineraries.youragency.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name itineraries.youragency.com;

    ssl_certificate     /etc/letsencrypt/live/itineraries.youragency.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/itineraries.youragency.com/privkey.pem;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    client_max_body_size 15M;

    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_set_header   Upgrade           $http_upgrade;
        proxy_set_header   Connection        "upgrade";
        proxy_read_timeout 120s;
        proxy_send_timeout 120s;
    }
}
```

Enable the configuration and issue SSL:
```bash
sudo ln -s /etc/nginx/sites-available/trippygo /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d itineraries.youragency.com
```

---

### Production Security Checklist

- [x] **SSRF Egress Defense:** `src/lib/security/ssrf.ts` actively blocks requests to RFC 1918 subnets and cloud metadata endpoints (`169.254.169.254`).
- [x] **Renderer Process Isolation:** The renderer runs in a sandboxed microservice container; Chromium failures cannot corrupt web processes.
- [x] **Zero-Leak Client Projection:** The `computeClientView()` function runs automatically prior to rendering and state distribution.
- [x] **HMAC Render Signing:** The `/print/[id]` template route rejects requests missing valid time-stamped signatures.
- [x] **Rate Limiting:** Enforces strict per-user/per-IP rate limits on AI extraction (`10/hr`), PDF rendering (`20/hr`), and photo search (`100/hr`).
- [x] **404 Anti-Probing Guarantee:** Requests for unowned proposals by sales staff strictly return `404 Not Found` (never `403 Forbidden`) to eliminate ID probing.
- [x] **Last Active Admin Protection:** API and DB constraints prevent demoting or deactivating the last active administrator.
- [x] **Append-Only Audit Ledger:** Sensitive operations (`itinerary.create`, `itinerary.update`, `itinerary.soft_delete`, `itinerary.restore`, `itinerary.reassign`, `pdf.generate`, `user.invite`, `user.ban`) recorded to immutable audit ledger.

---

## 8. Testing Suite & Quality Verification

TrippyGo maintains a rigorous automated testing suite covering money mathematics, schema migrations, security boundaries, and PDF binary leaks:

```bash
# Run all core test suites
npm test
```

### Individual Test Commands

| Command | Suite | Purpose |
| :--- | :--- | :--- |
| `npm run test:unit` | **Pricing & Schema** | Verifies paise math, margin floor checks, GST modes, and v0 ➔ v1 migration |
| `npm run test:dates` | **Calendar Engine** | Tests Asia/Kolkata timezone rollover, leap years, and cross-month itineraries |
| `npm run test:auth` | **Auth & 404 Anti-Probing** | Verifies RBAC, 404 anti-probing, proposal reassignment, and admin safety |
| `npm run test:security` | **Security Audit** | Scans client files for secret leaks, tests 10MB upload limits and SSRF defenses |
| `npm run test:docker` | **DevOps Audit** | Verifies container healthcheck configurations, resource limits, and Next standalone output |
| `npm run test:leak` | **PDF Binary Leak** | Renders actual PDF and parses binary stream to assert zero supplier net rate leakage |
| `npm run test:visual` | **Visual Regression** | Validates pixel consistency across 8 benchmark multi-page PDF proposals |
| `npm run test:e2e` | **End-to-End** | Full browser workflow: upload ➔ AI parse ➔ flight builder ➔ PDF generation |
| `npx tsx src/lib/flights/journey.test.ts` | **Flight Engine** | Tests layover calculations, cross-midnight arrivals, and journey grouping |

---

## 9. Repository Structure

```
.
├── src/
│   ├── app/                      # Next.js 16 App Router
│   │   ├── page.tsx              # Executive Workbench & Proposal Dashboard
│   │   ├── itineraries/[id]/edit # Two-Pane Proposal Editor & Live Preview
│   │   ├── admin/settings        # Commercial Governance & Agency Settings
│   │   ├── print/[id]            # HMAC-Protected Headless Print Route
│   │   ├── api/                  # RESTful API Endpoints (extract, flights, etc.)
│   ├── components/
│   │   ├── dashboard/            # WorkbenchHeader, ItineraryTable, NewItineraryModal
│   │   ├── editor/               # FlightsPanel, AirportInput, PricingPanel, etc.
│   ├── lib/
│   │   ├── config/               # Agency runtime settings & default fallback
│   │   ├── db/                   # Itinerary CRUD, listing, and version snapshots
│   │   ├── extraction/           # Gemini, Claude, and OpenAI client wrappers
│   │   ├── flights/              # Journey-first grouping, airports dict, layover math
│   │   ├── pricing.ts            # Paise math, Indian GST, and rounding engine
│   │   ├── schema/               # Zod ItinerarySchema, migrateItinerarySchema
│   │   ├── security/             # SSRF firewall, MIME and magic byte validation
│   ├── templates/itinerary/      # Cormorant & Plus Jakarta Sans A4 Print Templates
├── services/renderer/            # Standalone Playwright Chromium PDF Microservice
├── docs/                         # Architecture, UI Redesign, and Privacy Specs
├── sample-itineraries/           # 20 Realistic DMC supplier test fixtures
├── ARCHITECTURE.md               # Detailed system design specification
├── Dockerfile                    # Multi-stage Next.js production build
├── docker-compose.yml            # Multi-container local & server cluster
└── package.json
```

---

## 10. Further Documentation

- **System Architecture Deep-Dive:** [`ARCHITECTURE.md`](file:///c:/programming-files/WEB-DEV/TrippyGo/TrippyGo-PDF-Itinerary-Generator/ARCHITECTURE.md)
- **Data Privacy & LLM Ingestion:** [`docs/DATA_PRIVACY_NOTE.md`](file:///c:/programming-files/WEB-DEV/TrippyGo/TrippyGo-PDF-Itinerary-Generator/docs/DATA_PRIVACY_NOTE.md)
- **Workbench Redesign Specification:** [`docs/HOMEPAGE_WORKBENCH_REDESIGN_PLAN.md`](file:///c:/programming-files/WEB-DEV/TrippyGo/TrippyGo-PDF-Itinerary-Generator/docs/HOMEPAGE_WORKBENCH_REDESIGN_PLAN.md)
- **Flight Details Architecture:** [`docs/FLIGHT_DETAILS_UI_REDESIGN_PLAN.md`](file:///c:/programming-files/WEB-DEV/TrippyGo/TrippyGo-PDF-Itinerary-Generator/docs/FLIGHT_DETAILS_UI_REDESIGN_PLAN.md)
- **A4 Portrait Cover Blueprint:** [`docs/A4_PORTRAIT_COVER_IMAGES_IMPLEMENTATION_PLAN.md`](file:///c:/programming-files/WEB-DEV/TrippyGo/TrippyGo-PDF-Itinerary-Generator/docs/A4_PORTRAIT_COVER_IMAGES_IMPLEMENTATION_PLAN.md)

---

**© 2026 TrippyGo by Friends Travel.** Built for travel professionals.
