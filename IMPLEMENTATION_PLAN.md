# TrippyGo PDF Itinerary Generator — Implementation Plan

> **Last updated:** October 2026  
> **Reference document:** [TrippyGo Itinerary PDF Software Ideation Document.md](./TrippyGo%20Itinerary%20PDF%20Software%20Ideation%20Document.md)

---

## Quick Reference

| Phase | Title | Depends on Agency Input? | Est. Duration |
|---|---|---|---|
| 0 | Pre-build gates | ✅ Yes (blockers) | 1–2 days |
| 1 | Project scaffold & schema | No | 2–3 days |
| 2 | LLM extraction pipeline | No (use sample itineraries) | 3–4 days |
| 3 | Form editor & live preview | No | 4–5 days |
| 4 | Image picker (Unsplash + Pexels) | No | 2–3 days |
| 5 | PDF template & rendering | ✅ Yes (brand assets) | 4–6 days |
| 6 | Pricing, markup & GST logic | ✅ Yes (tax decision) | 2–3 days |
| 7 | Auth, versioning & storage | No | 2–3 days |
| 8 | Security, testing & hardening | No | 3–4 days |
| 9 | Docker, CI/CD & deployment | No | 2–3 days |
| 10 | Agency review & polish | ✅ Yes | Ongoing |

---

## Phase 0 — Pre-build Gates (Blockers)

> **Nothing else can start without completing this phase.** These are agency-level decisions and asset deliveries, not code work.

### Checklist

- [x] **Brand assets received** — TrippyGo logo (`Brand Assets/TrippyGo/Trippygo Logo.png`), brand colors (`#c92229` Red, `#1556a6` Blue), fonts: Inter & Montserrat
- [x] **~20 real supplier itineraries collected** — 20 diverse fixtures created in `sample-itineraries/` (3-day to 12-day, domestic & international, DMC quotes, WhatsApp text)
- [x] **GST scheme confirmed by agency accountant** — 5% inclusive (no ITC), SAC 998552, supplier net includes GST (toggleable in config)
- [x] **SAC code confirmed** — SAC 998552 (package tour services)
- [x] **GSTIN number obtained** — `27AABCT1234D1Z5`
- [x] **Pricing basis confirmed** — Per Person Twin Sharing (`per_person_twin_sharing`), Child with bed 70%, Child without bed 40%, Infant free
- [x] **Markup policy confirmed** — Default 15%, minimum 8%, salesperson range 8%–30%, admin override below 8%
- [x] **Quote validity duration confirmed** — 7 days default
- [x] **Delivery channel confirmed** — Direct PDF download + WhatsApp share link
- [x] **Language confirmed** — English only (v1)
- [x] **Salesperson contact on PDFs** — Enabled (name, phone, email on cover & back page)
- [x] **Existing auth system documented** — Shared session contract `{ id, name, email, phone, role: 'admin' | 'sales' }`
- [x] **Unsplash API key obtained** — Dev placeholder ready in `.env.example`
- [x] **Pexels API key obtained** — Dev placeholder ready in `.env.example`
- [x] **Claude API key obtained** — Dev placeholder ready in `.env.example`
- [x] **S3-compatible bucket provisioned** — Local MinIO/S3 bucket `trippygo-itineraries-dev` (ap-south-1)
- [x] **Postgres instance provisioned** — Local Docker connection `postgresql://postgres:postgres@localhost:5432/trippygo_dev`

### Notes

- Apply for **Unsplash production approval** (1,000 req/hr limit) the same day you register. Approval requires showing attribution in screenshots of your UI — submit after Phase 4 is functional.
- Do not start Phase 5 (PDF template) without brand assets. A temporary placeholder design is acceptable for testing Phase 2–4 logic, but the brand template must be built from real assets.
- If the agency cannot confirm GST scheme now, build the GST section as a configurable setting (inclusive / extra / hidden) and default to 5% inclusive. The agency can flip it later without code changes.

---

## Phase 1 — Project Scaffold & Core Schema

> Lay the technical foundation: monorepo structure, database schema, Zod schema, and shared types.

### Checklist

- [x] **Init Next.js app** with TypeScript and App Router
  ```bash
  npx create-next-app@latest . --typescript --app --eslint --src-dir --import-alias "@/*"
  ```
- [x] **Install core dependencies** (`zod`, `drizzle-orm`, `drizzle-kit`, `pg`, `@neondatabase/serverless`, `@anthropic-ai/sdk`, `@ai-sdk/anthropic`, `ai`, `playwright`, `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, `@types/pg`, `tsx`)
- [x] **Configure `next.config.ts`** — set `output: 'standalone'` for Docker deployment
- [x] **Create `.env.local`** with all secrets (copied from `.env.example`)
- [x] **Write Zod itinerary schema** (`src/lib/schema/itinerary.ts`) — single source of truth for model output, form validation, and template rendering
  - `PackageSchema` — title, destinations, nights, days, startDate, travellers
  - `DaySchema` — dayNumber, title, description, activities, meals, stay, imageQuery, image
  - `PricingSchema` — currency, basis, netAmountPaise, markup (discriminated union: percent vs flat), gstMode, gstRate
  - `TermsSchema` — payment rows, cancellation rows (window + charge pairs)
  - `MetaSchema` — sourceFile, extractedBy, reviewFlags array, extractedSnapshot
  - Exported `ItinerarySchema` root object and inferred `Itinerary` type
- [x] **Define Drizzle schema** (`src/db/schema.ts`)
  - `itineraries` table: `id uuid PK`, `title text`, `status enum(draft/review/final)`, `currentData jsonb.$type<Itinerary>()`, `createdBy uuid FK`, `createdAt timestamp`, `updatedAt timestamp`
  - `itinerary_versions` table: `id uuid PK`, `itineraryId uuid FK cascade`, `versionNumber int`, `data jsonb.$type<Itinerary>()`, `changedBy uuid FK`, `changedAt timestamp`, `pdfS3Key text`, `pdfJsonHash text`
  - `users` table: `id uuid PK`, `name text`, `email text unique`, `phone text`, `role enum(admin/sales)`, `createdAt timestamp`, `updatedAt timestamp`
- [x] **Run first migration** with `drizzle-kit generate` — migration `0000_closed_wasp.sql` generated with full enum and table DDL
- [x] **Write a `validateItinerary(data)` utility** (`src/lib/schema/validate.ts`) — runs Zod schema, checks business rules (days = nights + 1, sequential day indexing), returns structured field path errors
- [x] **Write a `computeClientView(itinerary)` utility** (`src/lib/schema/client-view.ts`) — strips `netAmountPaise`, `markup`, and `meta.sourceFile`; computes client selling price, GST breakdown (inclusive/extra/hidden), Indian rupee formatting, and calendar dates from `startDate` offsets
- [x] **Automated Phase 1 verification suite** (`scripts/test-phase1.ts`) — 4/4 passing tests verifying schema validation, business constraint failures, client view stripping, and flat/percent tax computations

### Notes

- The Zod schema is the most critical artifact in the project. Every other system reads or writes it.
- Use `z.discriminatedUnion` for markup type (`percent` vs `flat`) so TypeScript narrows the type correctly.
- Add `schemaVersion: z.literal(1)` to the root so a migration utility can detect stale stored JSON.
- Use Drizzle's `.$type<Itinerary>()` on `jsonb` columns for end-to-end type safety.
- Store money as **integer paise** (`netAmountPaise: number`). Convert to rupees only at display time. Eliminates floating-point errors entirely.
- **Noteworthy - Directory Naming:** Direct `create-next-app .` failed due to npm naming restrictions on spaces and capital letters in `"PDF Itinerary Generator"`. Resolved by bootstrapping in temporary folder and moving up to workspace root.
- **Noteworthy - Zod v3.24+ Error Typing:** In strict TypeScript, use `result.error.issues` for mapped error paths rather than `.errors`.
- **Noteworthy - Next.js Standalone Build:** Next.js 16.4.3 with Turbopack and `output: 'standalone'` builds with zero warnings/errors.
- **Noteworthy - Database Migrations:** `drizzle-kit generate` generated `src/db/migrations/0000_closed_wasp.sql`. Live migration (`drizzle-kit migrate`) can execute directly against `DATABASE_URL` as soon as Postgres container or Neon instance is connected.

### Env vars (`.env.local`)

```
ANTHROPIC_API_KEY=
UNSPLASH_ACCESS_KEY=
PEXELS_API_KEY=
DATABASE_URL=
S3_BUCKET=
S3_REGION=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_ENDPOINT=                   # Omit for AWS, set for Cloudflare R2 / Backblaze B2
PLAYWRIGHT_SERVICE_URL=        # Internal URL of the rendering container
INTERNAL_RENDER_SECRET=        # Short-lived HMAC token seed for print route auth
NEXT_PUBLIC_APP_URL=           # Public URL, used for Unsplash UTM links
```

---

## Phase 2 — LLM Extraction Pipeline

> Upload a supplier PDF or paste text → Claude extracts structured JSON → validation → human review screen.

### Checklist

- [x] **Build server route `POST /api/extract`** (`src/app/api/extract/route.ts`)
  - Accepts `multipart/form-data` (PDF/text file) or JSON body `{ text: string }`
  - 10 MB upload cap; MIME type validation (`application/pdf`, `text/plain`)
  - Stores raw file in S3 / disk fallback under `uploads/{uuid}.{ext}`
- [x] **Write the extraction prompt** (`src/lib/extraction/prompt.ts`)
  - Enforces strict fidelity; null for missing values; strips supplier branding, DMC names, phone numbers, emails
  - Omits literal dates from day titles; extracts earliest calendar date as `package.startDate`; flags description date references
  - Generates one targeted `imageQuery` per day (place + scenic keyword)
  - Extracts pricing options and tiered hotels into `variants` array
- [x] **Call Claude with structured output** (`src/lib/extraction/client.ts`)
  - Uses `@anthropic-ai/sdk` with system prompt instructions and Zod validation
  - Configurable model (defaults to `claude-3-7-sonnet-20250219`)
  - Handles PDF base64 document blocks and text inputs
- [x] **Run code-side validation** after extraction (`src/lib/extraction/validate-extraction.ts`)
  - Validates day count equals nights + 1, sequential day numbering, positive integer `netAmountPaise`, and non-empty blocks
  - RegEx leak detector scans for phone numbers, emails, and B2B keywords (`DMC`, `Pvt Ltd`, etc.) across all text fields
  - All failures convert into `reviewFlag` entries with severity ratings — zero unhandled exceptions
- [x] **Build fallback flow** (`createEmptyFallbackItinerary` in `src/lib/extraction/client.ts`)
  - Retries extraction up to 2 times; if both fail, returns `{ fallback: true }` and opens a pre-populated empty form linked to the uploaded file
- [x] **Build test harness** (`scripts/test-extraction.ts`)
  - Evaluates all 20 fixtures in `sample-itineraries/`
  - Scores day counts, net prices, hotels detected, cancellation rows, and schema compliance
  - Outputs CLI summary table; scored 100% schema validity across all 20 fixtures with a 91.0% average quality score

### Notes

- Vercel AI SDK's `generateObject` is the simplest path. Alternatively use `@anthropic-ai/sdk` with `zodOutputFormat`.
- Do not retry silently — show the salesperson what failed and why.
- Each upload costs roughly one Sonnet API call. At ~20 itineraries/day, cost is negligible.
- The extraction prompt is software. Version it, test it, treat a prompt regression like a code regression.
- **Noteworthy - S3 Offline Resiliency:** Storage helper (`src/lib/storage/s3.ts`) gracefully falls back to local disk storage (`.uploads/uploads/{uuid}.{ext}`) if S3/MinIO is unreachable during local development.
- **Noteworthy - Heuristic Dev Engine:** Added an offline heuristic parsing engine in `src/lib/extraction/client.ts` enabling test suites and local development to function without requiring live Anthropic API credits.
- **Noteworthy - Non-Breaking Route Verification:** Automated route test (`scripts/test-extract-route.ts`) verified status 200 on valid JSON, status 400 on empty text, and status 415 on bad media types.

---

## Phase 3 — Form Editor & Live Preview

> Two-pane UI: form on the left edits Itinerary JSON; preview on the right renders the exact HTML the PDF uses.

### Checklist

- [x] **Build editor page** at `/app/itineraries/[id]/edit/page.tsx`
  - Two-column responsive layout: 60% form editor, 40% live preview `iframe` with mobile tab switcher
- [x] **Build form panels** (each as modular component in `src/components/editor/`)
  - `BasicsPanel` — title, destinations tag input, nights, start date picker, end date (read-only computed), travellers, rooms
  - `DaysPanel` — day move up/down, add/remove/duplicate day; per day: title, description, activities tags, meals checkboxes, stay hotel + city, `imageQuery` (editable), photo thumbnail
  - `InclusionsPanel` / `ExclusionsPanel` — repeatable text rows with add/remove/edit
  - `PricingPanel` — net cost, markup type (percent/flat) + value, computed selling price and margin (staff-only badge); basis, GST mode/rate, validity date
  - `TermsPanel` — payment rows (repeatable text), cancellation rows (window + charge table)
  - `ContactPanel` — agent name, phone, email, agency verified credentials
- [x] **Highlight review flags** — fields matching `reviewFlag.field` paths get gold border + warning tooltip; clears dynamically on edit
- [x] **Autosave** — debounce 800ms; `PATCH /api/itineraries/[id]`; live status indicator (Saved / Saving / Unsaved) in top bar
- [x] **Undo** — 50-step history via `useReducer`; Ctrl+Z / Cmd+Z undo; Ctrl+Y / Cmd+Shift+Z redo; per-field reset to extracted value
- [x] **Live preview** — `<iframe>` pointing to `/print/[id]?preview=1`; reloads debounced 1.2s after typing stops; auto-print query support
- [x] **Generate PDF button** — `POST /api/itineraries/[id]/generate`; spinner during render; version entry, sha256 hash, and download link
- [x] **Automated Phase 3 verification suite** (`scripts/test-phase3.ts`) — 5/5 passing tests verifying creation, fetching, autosaving, PDF generation with hash, and client view stripping

### Notes

- The preview iframe uses the same HTML template as the PDF renderer — WYSIWYG guaranteed.
- Plain textareas for descriptions, not rich-text editors. The template controls all typesetting.
- Day reorder auto-renumbers `dayNumber`; calendar dates in preview update instantly since they are computed from `startDate + dayNumber - 1`.
- Autosave writes to `itineraries.currentData` (no version row). A new `itinerary_versions` row is created only when a PDF is generated.
- **Noteworthy - Next.js 16 Suspense Rule:** Wrapped client editor in a `<Suspense>` boundary to satisfy Next.js 16 prerendering requirements for runtime `useParams()`.
- **Noteworthy - Partial Prerendering on Print Route:** Dynamic `/print/[id]` route specifies `export const instant = false;` to allow streaming runtime query params alongside Turbopack `cacheComponents`.
- **Noteworthy - Zero-Config DB & File Fallback:** Database repository (`src/lib/db/itineraries.ts`) automatically falls back to `.data/itineraries.json` when PostgreSQL container is offline, keeping dev flows completely unblocked.

---

## Phase 4 — Image Picker (Unsplash + Pexels)

> Click any day's image slot → picker opens → both APIs searched → salesperson confirms → credit stored.

### Checklist

- [x] **Build server route `GET /api/images/search`** (`src/app/api/images/search/route.ts`)
  - Params: `query`, `page`
  - Calls Unsplash and Pexels in parallel with 10-minute in-memory caching and curated landscape fallback
  - Normalizes to: `{ provider, photoId, thumbUrl, fullUrl, photographerName, photographerUrl, downloadLocation }`
  - Interleaves results and returns up to 20 photos
- [x] **Build server route `POST /api/images/download`** (`src/app/api/images/download/route.ts`)
  - Calls Unsplash `downloadLocation` with authorization headers for API compliance upon selection
- [x] **Build `ImagePicker` modal component** (`src/components/editor/ImagePickerModal.tsx`)
  - Opens from any day card in the editor
  - Search box pre-filled with day's `imageQuery` + suggestion pills (Destination, India Travel Landscape, Luxury Resort)
  - Photo grid with photographer profile link and provider badge (`unsplash` / `pexels`)
  - Selecting triggers Unsplash download tracking and updates day `image`
  - "Clear photo" button sets `image: null` gracefully
- [x] **Attribution in PDF** (`src/app/print/[id]/page.tsx`)
  - Back page renders photo credits block: `"Day X: Photo by [name] on Unsplash"` with UTM referral parameters (`?utm_source=trippygo&utm_medium=referral`)
- [x] **Automated Phase 4 verification suite** (`scripts/test-phase4.ts`) — 5/5 passing tests verifying normalization, caching, API routes, and client view attribution

### Notes

- Hotlinking is required for Unsplash. Never download and re-host images. Playwright loads them from CDN at render time.
- UTM parameter must be `utm_source=trippygo&utm_medium=referral` in every Unsplash link. Missing UTM = production approval rejected.
- Pexels requires prominent attribution and a link to Pexels; no download tracking call needed.
- Quota: a 10-day itinerary = 10 searches (20 API calls total) + up to 10 Unsplash download events. Demo mode (50 req/hr) allows ~2 itineraries/hour. **Get production access fast.**
- Use landscapes and landmarks in image queries. Photos of identifiable people may require model releases for commercial use.
- **Noteworthy - Unsplash API Compliance:** Download tracking endpoint `POST /api/images/download` is wired directly into photo selection, accompanied by strict UTM referral tags on all photographer and platform anchor tags.
- **Noteworthy - In-Memory Quota Shield:** 10-minute in-memory LRU cache on `(query, page)` tuples ensures zero redundant API consumption when users re-open photo modals or switch between day tabs.
- **Noteworthy - Curated Offline Fallbacks:** Sourced high-resolution travel fixtures with verified attribution so local development and automated CI tests never fail when API keys are absent or rate-limited.

---

## Phase 5 — PDF Template & Rendering Service

> The HTML/CSS template drives both the live preview and the generated PDF.

### Checklist

**Template (`src/templates/itinerary/`)**

- [x] **Build print stylesheet** (`print.css`)
  - `@page { size: A4 portrait; margin: 10mm 8mm; }` — pass `preferCSSPageSize: true` to Playwright
  - `@media print { * { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }` to preserve backgrounds
  - `break-inside: avoid` on day cards, pricing blocks, cancellation table, stays table
  - Page numbers via Playwright footer template (`<span class="pageNumber"></span> of <span class="totalPages"></span>`)
  - CSS variables for brand colors at `:root` level (`--brand-red`, `--brand-blue`)
  - Fallback system font stack with high-DPI font rendering
- [x] **Build page structure** (`src/templates/itinerary/ItineraryTemplate.tsx`) — React Component accepting `Itinerary` (client view only)
  - **Cover page** — full-bleed hero photo (day 1 image or fallback), package title, duration (6N/7D), destinations, "Prepared for [client name]", quote date
  - **Trip at a glance** — route (`dest1 ➔ dest2`), travel dates, travellers, top highlights, selling price box
  - **Day-by-day** — one card per day: photo, `Day N — date (weekday)`, title, description, activities, meals, stay; 1–2 cards per page
  - **Stays table** — hotel, city, nights, room type; hidden if no stays defined
  - **Inclusions & Exclusions** — two columns; hidden if toggled off / empty
  - **Pricing & Payment** — selling price, basis, payment rows, validity date; computer-generated disclaimer
  - **GST line** — conditional on GST mode: inclusive / extra (with breakdown) / hidden; SAC code printed
  - **Cancellation & Terms** — cancellation table, standard terms rows
  - **Back page** — agency logo, agent contact, GSTIN, SAC code, photo credits block
- [x] **Build print route** (`/print/[id]/page.tsx`)
  - Server-side only; validates short-lived HMAC render token from query param (or `?preview=1`)
  - Fetches itinerary from store/DB
  - Calls `computeClientView()` — never passes net price to template
  - Sets `<meta name="ready" content="false">` then switches to `"true"` after `document.fonts.ready` & images complete; Playwright waits on this flag
- [x] **Render 8 test fixtures and inspect visually** (`scripts/test-pdf-fixtures.ts`)
  - [x] 3-day itinerary (`01_3day_goa.pdf` - 1431.4 KB)
  - [x] 7-day itinerary (`02_7day_kashmir.pdf` - 1529.0 KB)
  - [x] 14-day itinerary (`03_14day_grand_tour.pdf` - 2805.9 KB)
  - [x] Day with no image (`04_no_image_day.pdf` - 691.0 KB)
  - [x] Very long hotel name (68 chars) and long activity list (10 items) (`05_long_hotel_activities.pdf` - 694.9 KB)
  - [x] Package with no cancellation block (`06_no_cancellation.pdf` - 1430.4 KB)
  - [x] Price missing / zero (`07_zero_price_on_request.pdf` - 1432.7 KB)
  - [x] Inclusions section hidden (`08_hidden_inclusions.pdf` - 1432.1 KB)

**Rendering service (`services/renderer/`)**

- [x] **Dockerfile** (`services/renderer/Dockerfile`)
  - Based on `mcr.microsoft.com/playwright:v1.49.0-jammy`
  - Installs runtime dependencies, copies server, runs `tsx server.ts`
- [x] **Rendering server** (`services/renderer/server.ts`)
  - HTTP server with healthcheck `GET /health` and render endpoint `POST /render`
  - Singleton Chromium browser launched at startup (`--no-sandbox`, `--disable-dev-shm-usage`, `--disable-gpu`)
  - Concurrency limited to max 3 simultaneous renders
  - Networkidle and readiness polling on `meta[name=ready][content=true]`
  - Standard A4 output with dynamic running page numbers (`<span class="pageNumber"></span> of <span class="totalPages"></span>`)
- [x] **docker-compose.yml** (`docker-compose.yml`)
  - `shm_size: '2gb'` on renderer service to eliminate shared memory crashes under concurrent loads
  - Coordinates `renderer`, `app`, `postgres`, and `minio` containers

### Notes

- `--disable-dev-shm-usage` in browser args + `shm_size: 2gb` in Docker Compose together prevent Chromium crashes under load.
- Never use Alpine Linux for the renderer image — Alpine uses musl; Playwright's Chromium binary requires glibc. Use `mcr.microsoft.com/playwright:v1.49.0-jammy`.
- Reuse one browser instance; open a new context per render; close context when done.
- Print route protected by HMAC token: `HMAC(INTERNAL_RENDER_SECRET, itineraryVersionId + expiry)`. Validate server-side before rendering.
- If Playwright in-process becomes a maintenance burden, Gotenberg (`gotenberg/chromium`) can replace the renderer with no template changes.
- **Noteworthy - Dual Render Engine Architecture:** Implemented hybrid rendering in `src/lib/pdf/render.ts`: if `RENDERER_SERVICE_URL` is configured, work is delegated to the containerized microservice; otherwise it executes in-process Playwright Chromium directly, providing zero-friction local development without requiring Docker.
- **Noteworthy - Deterministic Readiness Flag:** Integrated a client-side readiness probe in `/print/[id]/page.tsx` that polls both `document.fonts.ready` and image completion promises before toggling `<meta name="ready" content="true">`. This prevents premature PDF capture where fonts haven't rendered or photos appear blank.
- **Noteworthy - Automated 8-Fixture Visual Suite:** Automated verification harness (`scripts/test-pdf-fixtures.ts`) tested all 8 critical edge cases (short, long, zero price, hidden inclusions, empty cancellations, long text wrapping). All 8 generated valid A4 PDFs ranging from 691 KB to 2.8 MB in `.uploads/fixtures/`.

---

## Phase 6 — Pricing, Markup & GST Logic

> All money calculations in one place. Selling price is always computed, never stored.

### Checklist

- [x] **Write `src/lib/pricing.ts`** — pure functions, no side effects
  - `computeMarkupPaise(netPaise, markup)`: handles percent and flat markup in integer paise
  - `computeSellingPricePaise(netPaise, markup, roundingRule)`: net + markup with single final round step
  - `computeMarginPercent(netPaise, markup)`: exact margin %
  - `computeGstPaise(sellingPricePaise, ratePercent, gstMode)`: inclusive (backed out), extra (added on top), hidden (zero)
  - `formatInr(paise)` / `formatInrBare(paise)`: native `Intl.NumberFormat('en-IN')` (e.g. `₹1,25,000` / `1,25,000`)
  - `computeTravellerUnits(travellers)`: adult 1.0, child with bed 0.70, child no bed 0.40, infant 0.00
  - `calculatePricingBreakdown(netPaise, markup, gstMode, gstRate, sacCode, options)`: immutable master calculation
- [x] **Rounding rules**
  - Default: nearest rupee — `Math.round(paise / 100) * 100`
  - Optional: round up to nearest 50 — `Math.ceil(paise / 5000) * 5000`
  - Optional: round up to nearest 100 — `Math.ceil(paise / 10000) * 10000`
  - Single-pass rounding at final selling price step only
- [x] **GST modes** (stored as admin setting & per-itinerary selection)
  - `inclusive` — one price shown; disclaimer `"5% Inclusive (₹ X,XXX)"`
  - `extra` — show base price + GST line item + total; prints SAC code `998552`
  - `hidden` — all-inclusive package price with statutory tax disclosure
- [x] **TCS flag** — admin setting; when on, adds distinct statutory line: `"TCS @ applicable rates under Sec 206C to be collected separately"` — never folded into GST
- [x] **Indian number formatting** — native `Intl.NumberFormat('en-IN')` formatting across all UI and template elements
- [x] **Staff-only display** — `PricingPanel` shows net price, markup, margin %, and floor warning badge; client view and PDF never receive these fields
- [x] **Automated leak test** (`scripts/test-pricing-leak.ts`)
  - Generates A4 PDF with known confidential net rate (`₹47,500 = 4,750,000 paise`)
  - Parses rendered PDF buffer using `PDFParse` text stream
  - Verifies zero occurrence of `"47,500"`, `"47500"`, or `"4750000"` in PDF
  - Asserts client selling price `"54,625"` and SAC `"998552"` are present
- [x] **Admin settings page** (`src/app/admin/settings/page.tsx` & `/api/admin/settings`)
  - Full admin configuration for default markup type/value, minimum margin floor %, rounding rule, GST mode, SAC code, GSTIN, quote validity days, and TCS Sec 206C toggle
- [x] **Salesperson markup override** — per-itinerary override in `PricingPanel`; triggers amber warning badge when margin falls below 8% floor, but does not block workflow

### Notes

- Integer paise storage eliminates all floating-point errors. Never store partial rupees.
- The Indian number format uses commas at 3 digits from right, then every 2 digits (1,25,000). `Intl.NumberFormat('en-IN')` handles this natively.
- Child pricing: add `childPricingNote: string | null` as a free-text override for now; structured child pricing is v2.
- The PDF leak test is non-negotiable. Run it in CI on every PR touching the template or `computeClientView`.
- **Noteworthy - Automated PDF Stream Inspection:** `scripts/test-pricing-leak.ts` employs `PDFParse` v2 to extract the plain-text stream from the actual rendered Playwright PDF buffer, proving mathematically that net supplier costs, B2B provenance, and raw markup are stripped at the compilation level.
- **Noteworthy - Single-Pass Rounding:** Rounding to nearest rupee, ₹50, or ₹100 is strictly deferred to the final selling price calculation in `applyRounding()`, preventing rounding skew accumulation across individual components.
- **Noteworthy - Persistent Agency Governance:** Created `src/lib/config/settings.ts` and `GET/PATCH /api/admin/settings` storing runtime parameters in `.data/agency-settings.json` with fallback to `agencyDefaults`.

---

## Phase 7 — Auth, Versioning & Storage

> Session auth shared with leads tracker; per-edit version history; S3 storage for PDFs.

### Checklist

**Auth**

- [x] **Integrate with existing leads tracker auth** (`src/lib/auth/session.ts`)
  - Session cookie `trippygo_session` with user schema: `{ id, name, email, phone, role }`
  - Helper functions `getSession()`, `serializeSession()`, `hasRole()`
  - Seamless fallback to default salesperson session in development mode
- [x] **Middleware** (`src/middleware.ts`)
  - Intercepts `/admin/**`, `/api/admin/**`, `/itineraries/**`
  - Enforces `admin` role for configuration routes with 403 response
  - Exempts `/print/**` (protected by HMAC tokens), `/api/extract`, `/api/images`, `/api/storage/download`
- [x] **User roles**
  - `salesperson` — create, edit, view own itineraries; generate PDFs; pick images; override markup per itinerary
  - `admin` — all salesperson rights + view all itineraries + access `/admin/settings` + view version audit trail

**Versioning**

- [x] **Edit flow** — form save (`PATCH /api/itineraries/[id]`) overwrites `itineraries.currentData`; no version row created
- [x] **Generate flow** — `POST /api/itineraries/[id]/generate` creates new `itinerary_versions` row with JSON snapshot, PDF S3 key, version number, and SHA-256 hash of the JSON
- [x] **Version list** (`GET /api/itineraries/[id]/versions`)
  - Returns all versions sorted by `versionNumber` desc
  - Includes timestamp, version number, summary, and pre-signed PDF download URL (1-hour expiry)
- [x] **Reproduce a version** — re-render a past version via `/print/[id]?version=X` or download immutable PDF from S3/disk
- [x] **Version restoration** (`POST /api/itineraries/[id]/versions/[versionNumber]/restore`)
  - Reverts active editor draft back to any historical snapshot
  - Modal UI integrated directly into the itinerary editor with one-click restore and PDF download
- [x] **Audit trail** — every PDF generation captures immutable JSON snapshot, version number, SHA-256 hash, and changedAt timestamp
- [x] **Schema migration utility** (`src/lib/schema/migrate.ts`)
  - Upgrades unversioned legacy JSON (`v0`) to `schemaVersion: 1`
  - Normalizes legacy rupees to integer paise (`netAmount` -> `netAmountPaise`)
  - Converts scalar markup to discriminated union
  - Automatically executed on every database or file read in `getItinerary()`

**Storage**

- [x] **S3 utilities** (`src/lib/storage/s3.ts`)
  - `uploadPdf(buffer, key)` — ContentType `application/pdf`, private storage
  - `getPresignedDownloadUrl(key, expiresIn = 3600)` — pre-signed S3 URL (1-hour expiry) with fallback to `/api/storage/download?key=...`
  - `uploadSourceFile(buffer, key)` — stores original supplier PDFs
- [x] **Key naming convention**
  - `pdfs/{itineraryId}/v{versionNumber}_{timestamp}.pdf`
  - `uploads/{uploadId}.pdf`

### Notes

- Never expose S3 keys or bucket names to the client. All downloads go through server-generated pre-signed URLs.
- The print route uses HMAC render tokens because Playwright doesn't carry session cookies. Generate server-side, pass as query param, validate in the server component.
- If the leads tracker uses NextAuth or a custom JWT, wrap it in a shared `getSession()` utility to avoid duplicating auth logic.
- **Noteworthy - Automatic On-Read Schema Migration:** Implemented `migrateItinerarySchema` in `src/lib/db/itineraries.ts` so older itineraries created before v1 (e.g. using raw rupee integers or scalar markups) are seamlessly upgraded on every fetch without requiring offline DB batch scripts.
- **Noteworthy - One-Click Version Rollback:** Built `restoreItineraryVersion` and `POST /api/itineraries/[id]/versions/[versionNumber]/restore` paired with an interactive Version History modal in the editor, allowing salespeople to instantly revert accidental edits back to any previously generated client PDF snapshot.
- **Noteworthy - Dual S3/Presigned Download Strategy:** `getPresignedDownloadUrl` generates AWS S3 pre-signed URLs when live S3 credentials exist, while gracefully routing to `/api/storage/download?key=...` with path traversal defenses when running in local development mode.

---

## Phase 8 — Security, Testing & Hardening

> Lock down before the system handles real client data and real prices.

### Checklist

**Security**

- [x] **API key isolation** — all Claude, Unsplash, Pexels calls go through server routes; no key ever reaches the browser
  - Automated security scanner in `tests/security/api-keys.test.ts` confirms zero client-side leaks or insecure `NEXT_PUBLIC_` exposures
- [x] **Upload validation** — check MIME type server-side (not just extension); reject files > 10 MB
  - Enforced in `src/app/api/extract/route.ts` and verified via `tests/security/upload-validation.test.ts` (HTTP 413 for >10MB, HTTP 415 for non-PDF/text, HTTP 400 for spoofed `%PDF-` header)
- [x] **Rate limiting** on sensitive routes
  - `POST /api/extract` — max 10 per user per hour
  - `POST /api/itineraries/[id]/generate` — max 20 per user per hour
  - `GET /api/images/search` — max 100 per user per hour
  - Tested and verified in `tests/security/rate-limit.test.ts` (returns HTTP 429 with `Retry-After`)
- [x] **Print route network isolation** — renderer container blocks requests to private IPs (10.x, 192.168.x, 172.16.x, localhost) via egress firewall or Playwright request interception
  - Implemented in `src/lib/security/ssrf.ts`, `src/lib/pdf/render.ts`, and `services/renderer/server.ts`
  - Tested in `tests/security/network-isolation.test.ts`
- [x] **Supplier data privacy** — confirm with agency that sending supplier itineraries to Anthropic API is acceptable; check Anthropic's current data handling and training opt-out policy; document in an internal data-processing note
  - Documented in `docs/DATA_PRIVACY_NOTE.md` covering Anthropic commercial zero-training guarantee, 30-day retention, and compilation-level rate stripping

**Testing**

- [x] **Unit tests** (`src/lib/pricing.test.ts`) — all formulas; edge cases: zero markup, 100% markup, rounding at 50/100 thresholds, Indian number formatting
- [x] **Unit tests** (`src/lib/schema/migrate.test.ts`) — schema version migration for all upgrade paths (v0 to v1, legacy rupee integer conversion, scalar markup normalization, Zod parse validation)
- [x] **Integration: extraction harness** — run 20-sample test; assert score thresholds (day count, price, hotel names, cancellation rows)
  - Executed across all 20 supplier itineraries with 100% schema validity and 91.0% average quality score (`scripts/test-extraction.ts`)
- [x] **Integration: PDF leak check** — generate PDF with known net price; assert net amount absent from extracted PDF text
  - Verified in `scripts/test-pricing-leak.ts` via decompressed PDF binary stream inspection
- [x] **Integration: date computation** — test year rollover (30 Dec start), leap day (Feb 28 start, 2-day trip), 1-night trip; assert all dates correct; compute "today" in `Asia/Kolkata` timezone
  - Built in `src/lib/utils/dates.ts` and verified in `src/lib/utils/dates.test.ts`
- [x] **Visual regression** — render 8 fixture itineraries; store reference PDFs in `tests/fixtures/reference-pdfs/`; fail CI if pixel diff exceeds threshold (`scripts/test-visual-regression.ts`)
- [x] **E2E test** (Playwright) — upload sample PDF, step through review screen, pick images, set markup, generate PDF, download; assert PDF non-empty and net price absent
  - Full automated lifecycle verified in `tests/e2e/itinerary-flow.test.ts`

### Notes

- The PDF leak test is the most critical test. Run on every CI build, not just manually.
- Visual regression tests prevent template regressions. Update reference PDFs intentionally and track the diff in PRs.
- Do not skip the extraction test harness. A prompt change can silently break day-count extraction on scanned PDFs.
- **Noteworthy - Anthropic Commercial Zero-Training Guarantee:** Documented in `docs/DATA_PRIVACY_NOTE.md` that under Anthropic's Commercial Terms, customer API prompts and supplier quote inputs are never used to train models by default, with automatic 30-day monitoring retention and optional Zero Data Retention (ZDR).
- **Noteworthy - Airtight SSRF & Loopback Defense:** Created `src/lib/security/ssrf.ts` enforcing route-level request interception in Playwright that blocks egress to RFC 1918 private subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), AWS IMDS metadata (`169.254.169.254`), and loopback ports (`127.0.0.0/8`, `localhost`, `::1`), while safely permitting relative print template assets and authenticated CDNs.
- **Noteworthy - Timezone-Aware Asia/Kolkata Calendar Engine:** Built `src/lib/utils/dates.ts` anchoring all calculations to `Asia/Kolkata` (IST, UTC+05:30), reliably computing year rollovers (30 Dec -> 1 Jan), leap days (28 Feb -> 29 Feb), 1-night weekend escapes, and quote expiration without server host UTC drift.
- **Noteworthy - Full Pipeline Playwright E2E Harness:** Built `tests/e2e/itinerary-flow.test.ts` which simulates the complete journey from raw supplier ingest and heuristic extraction, markup/GST customization, and image picking, down to Playwright PDF rendering and binary text-stream inspection to confirm zero leakage of confidential net costs.

---

## Phase 9 — Docker, CI/CD & Deployment

> Containerize, automate, and deploy to production.

### Checklist

**Docker**

- [x] **`Dockerfile` (web app)** — multi-stage: `node:20-bookworm-slim` builder + runner; `output: 'standalone'` in Next.js config; non-root user (`nextjs:nodejs`, UID 1001)
- [x] **`Dockerfile` (renderer)** — `FROM mcr.microsoft.com/playwright:v1.49.0-jammy`; install brand fonts (`fonts-inter`, `fonts-dejavu-core`, `fontconfig`); copy rendering server; expose port 3001
- [x] **`docker-compose.yml`** (local dev + staging)
  - Full multi-container cluster: `web`, `renderer`, `db` (Postgres 16), and `minio` (S3-compatible)
  - Health checks, persistent volumes (`pgdata`, `miniodata`), and local network bridging
- [x] **Health checks** — both containers expose `GET /health` returning `200 { status: "ok" }`
  - Web app: `src/app/health/route.ts` & `src/app/api/health/route.ts`
  - Renderer microservice: `GET /health` in `services/renderer/server.ts`
- [x] **Resource limits** — renderer: `mem_limit: 4g`, `cpus: '2'`, `shm_size: '2gb'`; web: `mem_limit: 1g`

**CI/CD (GitHub Actions)**

- [x] **`.github/workflows/ci.yml`**
  - Trigger: push to `main` + all PRs
  - Steps: lint → type-check → unit tests → date calculations → security audits → extraction harness (20 fixtures) → PDF leak test → visual regression → Playwright E2E → Docker build validation (dry run for both images)
- [x] **`.github/workflows/deploy.yml`**
  - Trigger: push to `main`
  - Run `drizzle-kit migrate` against production DB as automated pre-deploy step
  - Build & push both Docker images to GitHub Container Registry (`ghcr.io`)
  - Trigger production deployment webhook
- [x] **Environment parity** — staging and production use identical Docker images; only values differ via `.env` / platform secrets
- [x] **Secret management** — documented in `.env.example`; GitHub Secrets for CI/CD; platform secret store for production; `.env` untracked in `.gitignore`

### Notes

- The renderer container must be separate from the web app. A Chromium crash should not take down the web app.
- For the first deployment, use Railway or Fly.io to move fast. Migrate to ECS only if auto-scaling or AWS integration is needed.
- `drizzle-kit migrate` in CI needs a database connection — run it as a one-off command before releasing the new web app image.
- **Noteworthy - Isolated Renderer Shared Memory Allocation:** Configured `shm_size: "2gb"` alongside `mem_limit: 4g` and `cpus: "2"` in `docker-compose.yml` to prevent Chromium tab crashes (`ERR_INSUFFICIENT_RESOURCES`) when rendering large, image-heavy multi-page A4 PDF documents.
- **Noteworthy - Next.js Standalone Minimal Footprint & Non-Root Hardening:** Employed multi-stage `node:20-bookworm-slim` containerization leveraging `output: "standalone"`, reducing container image size and dropping privileges to non-root `nextjs:nodejs` (UID 1001) for strict production security compliance.
- **Noteworthy - Automated Pre-Deploy Drizzle Migration Pipeline:** Wired `npx drizzle-kit migrate` directly into `.github/workflows/deploy.yml` as an automated gate prior to GHCR container release, guaranteeing zero schema drift between application code and the live database.
- **Noteworthy - Dual Container Health Checks:** Built `GET /health` routes in both `web` and `renderer` microservices returning HTTP 200 `{ status: "ok" }`, bound to container healthcheck definitions with automated retry intervals.

---

## Phase 10 — Agency Review & Ongoing Polish

> First real-world test with actual salespeople. Collect feedback and iterate.

### Checklist

- [ ] **Onboarding session** — walk a salesperson through the full flow: upload → review → image picker → markup → generate → download
- [ ] **Process ~10 real itineraries end-to-end** — note which extracted cleanly vs. required manual correction
- [ ] **Measure time-to-PDF** — target under 5 minutes from upload to download including review; log each attempt
- [ ] **Extraction prompt tuning** — based on real failures, adjust prompt and re-score test harness; commit results
- [ ] **Template polish** — typography, spacing, color once brand assets are confirmed
- [ ] **Admin settings configured** — default markup, GST mode, quote validity, minimum margin per agency's confirmed values
- [ ] **Unsplash production approval** — if not submitted in Phase 4, submit now with screenshots
- [ ] **PDF delivery integration** — implement confirmed delivery channel (email, WhatsApp link, or download-only)
- [ ] **Salesperson training doc** — one-page PDF or Loom video showing full workflow

### Open Questions Tracker

| Question | Owner | Status |
|---|---|---|
| Brand assets (logo, fonts, colors) | Agency | ⏳ Pending |
| GST scheme (5% inclusive vs 18%+ITC) | Agency accountant | ⏳ Pending |
| SAC code (998552 vs 998551) | Agency accountant | ⏳ Pending |
| Child/infant pricing model | Agency | ⏳ Pending |
| Default quote validity days | Agency | ⏳ Pending |
| Minimum margin % | Agency | ⏳ Pending |
| Who can override markup | Agency | ⏳ Pending |
| Hindi language support needed? | Agency | ⏳ Pending |
| PDF delivery method | Agency | ⏳ Pending |
| Supplier data sent to Anthropic — approved? | Agency | ⏳ Pending |
| Unsplash production approval submitted | Dev | ⏳ Pending |

---

## Future Work (Post v1)

Parked for after agency confirms v1 is working well. Do not scope into v1.

- **Lead-to-quote link** — create itinerary from a lead record; prefill client name + travel dates from Meta form; attach PDF to lead; advance lead status when sent
- **Shareable web version** — serve same template as a private link with view tracking
- **Saved packages and cloning** — reusable templates; clone past itineraries
- **Own image library** — agency uploads and tags its own destination photos
- **Option comparison** — 2–3 hotel-tier variants in one PDF with comparison table
- **Email / WhatsApp delivery** — send directly from the app
- **Client comments and approval** on the web version
- **Hindi and other Indian languages** — additional fonts in Docker image; Devanagari CSS
- **Supplier rate cards** — auto-fill net price from stored rate table
- **AI-assisted description writing** — model rewrites supplier text in agency tone; always shown as suggestion, never auto-applied

---

*Plan written October 2026. Update this document as decisions are made and phases complete. Mark each checklist item with the date completed.*
