# TrippyGo Auth & Access Control: Technical Architecture & Phased Implementation Plan

> **Executive Engineering Blueprint & Phased Rollout Guide**  
> **Status:** Approved for Implementation · **Date:** November 2026 · **Target Stack:** Next.js 16 (App Router), Better Auth, Drizzle ORM, PostgreSQL 16, Resend

---

## 1. Executive Summary & Architectural Overview

The purpose of this initiative is to transition the TrippyGo B2B Itinerary Generator from an open single-tenant interface into an authenticated, multi-user operations workbench featuring strict role-based access control (RBAC), data isolation, and comprehensive auditability.

### Primary Objectives
1. **Proposal Isolation:** A salesperson must strictly access, edit, and export their *own* itineraries. Requests for unowned proposals must resolve to `404 Not Found` (never `403 Forbidden`) to eliminate ID probing.
2. **Administrative Oversight:** Administrators retain organization-wide visibility across all proposals, user lifecycles, soft-deleted records, and audit logs, including the ability to reassign proposals between agents.
3. **Zero Commercial Leakage Invariant:** Internal supplier net rates, margin percentages, and calculation formulas must remain strictly isolated on the server (`computeClientView`), with zero leakage to the client-facing PDF.
4. **Decoupled PDF Pipeline:** The isolated headless Chromium Playwright renderer remains completely sessionless, relying exclusively on short-lived (60s) HMAC tokens minted only after ownership validation.

---

### System Architecture Diagram

```
                                      +---------------------------------------------+
                                      |             BROWSER CLIENT                  |
                                      |  - Login (/login)                           |
                                      |  - Sales Workbench (/)                      |
                                      |  - Admin Cockpit (/admin/users, /audit)     |
                                      +----------------------+----------------------+
                                                             |
                                           HTTPS Cookie: trippygo_session
                                                             |
                                      +----------------------v----------------------+
                                      |          NEXT.JS 16 APP ROUTER              |
                                      |                                             |
                                      |  [Middleware / Route Guard]                 |
                                      |  - Validates session cookie existence       |
                                      |  - Blocks unauthenticated access to /login  |
                                      |  - Restricts /admin/* to 'admin' role       |
                                      +----------------------+----------------------+
                                                             |
               +---------------------------------------------+---------------------------------------------+
               |                                             |                                             |
+--------------v---------------+              +--------------v---------------+              +--------------v---------------+
|     Better Auth Handler      |              |   Protected API Handlers     |              |     PDF Generation Route     |
|   /api/auth/[...all]         |              |   /api/itineraries/*         |              |  /api/itineraries/[id]/gen   |
|                              |              |                              |              |                              |
| • Email & Password           |              | 1. requireUser(req)          |              | 1. requireUser(req)          |
| • Admin Plugin (roles/bans)  |              | 2. Per-User Rate Limiter     |              | 2. Ownership verification    |
| • 7-day idle / 30-day abs    |              | 3. Scoped Data Access Layer  |              | 3. Mint 60s HMAC token       |
| • Resend Email Integration   |              |    - Admin: All / Unfiltered |              | 4. Dispatch to Renderer      |
+--------------+---------------+              |    - Sales: WHERE owner_id   |              +--------------+---------------+
               |                              +--------------+---------------+                             |
               |                                             |                                             | HTTP + HMAC Token
               |                                             |                               +-------------v--------------+
               |                                             |                               |  Headless Chromium Render  |
               |                                             |                               |  (Isolated Playwright Pod) |
               |                                             |                               +----------------------------+
+--------------v---------------------------------------------v---------------+
|                              POSTGRESQL 16                                 |
|                                                                            |
|  • user / session / account / verification (Better Auth Core + Admin)     |
|  • itineraries (owner_id, created_by, updated_by, deleted_at, deleted_by)  |
|  • itinerary_versions (inherited access)                                  |
|  • audit_logs (append-only ledger)                                         |
+----------------------------------------------------------------------------+
```

---

## 2. Core Security & Architectural Invariants

Every phase in this implementation must strictly adhere to the following architectural rules:

1. **Zero-ID Enumeration (Anti-Probing):**  
   If a salesperson attempts to read, edit, delete, or generate a PDF for an itinerary belonging to another salesperson, the server must return `404 Not Found`. Returning `403 Forbidden` leaks the existence of sensitive agency proposals.
2. **Fresh Session Evaluation (No Stale Claims):**  
   User status (active vs. banned) and role (`admin` vs. `salesperson`) must be verified against the database on every authenticated data request. A deactivated agent must lose system access immediately on their next click.
3. **Session-Free Chromium Rendering:**  
   The external PDF microservice must never receive user cookies or session tokens. Authorization is validated on the Next.js API layer *before* minting an ephemeral (60-second) HMAC token for `/print/[id]?token=...`.
4. **Soft-Delete Exclusivity:**  
   Salesperson deletion is strictly a soft-delete (`deleted_at = NOW()`). Soft-deleted records are omitted from sales views and search queries. Only administrators can view trash and restore proposals.
5. **Last Admin Protection:**  
   The system must prevent deactivating, banning, deleting, or demoting the last active administrator.
6. **No Client-Side Credential Leaks:**  
   `BETTER_AUTH_SECRET`, `DATABASE_URL`, and `RESEND_API_KEY` must never be referenced in client components. The existing `tests/security/api-keys.test.ts` scan must enforce this invariant.

---

## 3. Phased Implementation Roadmap

The implementation is broken down into **5 discrete phases**. Each phase is fully independent, verifiable via dedicated automated tests and manual gates, and prevents regressions in core itinerary and pricing workflows.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 1: Authentication Core & User Infrastructure (Better Auth + Resend)        │
│ └─► Better Auth setup, PostgreSQL schema, /login, invites & reset emails         │
├──────────────────────────────────────────────────────────────────────────────────┤
│ PHASE 2: Database Schema Evolution & Ownership Model                             │
│ └─► owner_id, audit stamps, soft deletion, audit_logs table, schemaVersion: 2   │
├──────────────────────────────────────────────────────────────────────────────────┤
│ PHASE 3: Server-Side Authorization Layer & Route Guarding                        │
│ └─► Data-access layer isolation, API route guards, 404 anti-probing, rate limits │
├──────────────────────────────────────────────────────────────────────────────────┤
│ PHASE 4: Administrative UI & Operations Cockpit                                  │
│ └─► /admin/users, proposal reassignment, trash restore, audit log viewer         │
├──────────────────────────────────────────────────────────────────────────────────┤
│ PHASE 5: Security Audits, Comprehensive Testing & Production Hardening           │
│ └─► test:security authorization suite, e2e test fixtures, CI/CD verification     │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Authentication Core & User Infrastructure

### Objective
Establish the foundational authentication infrastructure using Better Auth with PostgreSQL and Drizzle ORM, configure the email delivery engine with Resend, and implement editorial-grade authentication screens.

### Technical Specifications
- **Packages:** `better-auth`, `@better-auth/drizzle-adapter`, `resend`
- **Auth Endpoint:** `/api/auth/[...all]/route.ts` using `toNextJsHandler(auth)`
- **Session Architecture:** Server-stored sessions in PostgreSQL, identified via signed HTTP-only cookies (`trippygo_session`).
- **Password Policy:** Minimum 12 characters, scrypt password hashing, rate-limited against brute force (5 attempts / 15 minutes lockout).
- **Public Signup:** Strictly disabled (`disableSignUp: true`). Accounts created solely via admin invitation.
- **Email Delivery:** Transactional emails via Resend SDK with automatic console fallback in local development when `RESEND_API_KEY` is omitted.

---

### Detailed Implementation Tasks & Checklist

- [x] **1.1 Dependency Installation & Configuration**
  - [x] Install Better Auth and Resend: `npm install better-auth @better-auth/drizzle-adapter resend`
  - [x] Add auth environment variables to `.env.example`:
    - `BETTER_AUTH_SECRET` (32-character random string)
    - `BETTER_AUTH_URL` (`http://localhost:3000` or production domain)
    - `RESEND_API_KEY` (Resend API key)
    - `EMAIL_FROM` (e.g., `TrippyGo Operations <operations@trippygo.com>`)

- [x] **1.2 Database Schema for Better Auth**
  - [x] Update `src/db/schema.ts` with Better Auth tables matching Drizzle adapter requirements:
    - `user`: `id` (text, PK), `name` (text), `email` (text, unique), `emailVerified` (boolean), `image` (text), `role` (text, default 'salesperson'), `banned` (boolean), `banReason` (text), `banExpires` (timestamp), `createdAt` (timestamp), `updatedAt` (timestamp).
    - `session`: `id` (text, PK), `userId` (text, FK to `user.id` cascade), `token` (text, unique), `expiresAt` (timestamp), `ipAddress` (text), `userAgent` (text), `createdAt` (timestamp), `updatedAt` (timestamp).
    - `account`: `id` (text, PK), `userId` (text, FK to `user.id` cascade), `accountId` (text), `providerId` (text), `password` (text), `createdAt` (timestamp), `updatedAt` (timestamp).
    - `verification`: `id` (text, PK), `identifier` (text), `value` (text), `expiresAt` (timestamp), `createdAt` (timestamp), `updatedAt` (timestamp).
  - [x] Run `npx drizzle-kit generate` or `push` to apply tables to the PostgreSQL database container.

- [x] **1.3 Better Auth Server Initialization**
  - [x] Create `src/lib/auth/index.ts`:
    - Initialize `betterAuth` with `drizzleAdapter(db, { provider: "pg", schema: { ...schema } })`.
    - Configure `emailAndPassword`:
      - `enabled: true`
      - `disableSignUp: true`
      - `minPasswordLength: 12`
      - `resetPasswordTokenExpiresIn: 3600` (1 hour)
      - `sendResetPassword` callback wired to Resend.
    - Configure `session`:
      - `expiresIn: 60 * 60 * 24 * 30` (30 days absolute)
      - `updateAge: 60 * 60 * 24 * 7` (7 days idle refresh)
      - `cookieCache: { enabled: false }` (guarantees DB query per request for immediate ban/role sync).
    - Add `admin()` plugin with custom role mapping (`admin`, `salesperson`).
    - Configure rate limiting on auth endpoints (3 req/10s on auth routes; 3 req/60s on password reset).

- [x] **1.4 Email Delivery Subsystem (Resend)**
  - [x] Create `src/lib/email/resend.ts`:
    - Check for `process.env.RESEND_API_KEY`.
    - If missing: output formatted invitation/reset emails and URLs directly to `console.log` for development efficiency.
    - If present: dispatch through `new Resend(process.env.RESEND_API_KEY).emails.send()`.
  - [x] Create HTML email templates in `src/lib/email/templates/`:
    - `InvitationEmail`: Editorial TrippyGo welcome, 48-hour expiration note, single-use link to `/set-password?token=...`.
    - `PasswordResetEmail`: Security warning, 1-hour expiration note, link to `/reset-password?token=...`.

- [x] **1.5 Next.js App Router Catch-All Route**
  - [x] Create `src/app/api/auth/[...all]/route.ts`:
    - Export `const { GET, POST } = toNextJsHandler(auth)`.

- [x] **1.6 Better Auth Client Setup**
  - [x] Create `src/lib/auth/client.ts`:
    - Configure `createAuthClient` with `adminClient()` plugin.
    - Export `authClient`, `useSession`, `signIn`, `signOut`.

- [x] **1.7 User Interface: Authentication Screens**
  - [x] Create `src/app/(auth)/login/page.tsx`:
    - Condé Nast editorial aesthetic: Cormorant Garamond typography, `#091c3e` deep navy accents, clean inputs.
    - Fields: Email, Password.
    - Error handling: Uniform "Invalid email or password" error message (prevents user enumeration).
    - Rate limit lockout alerts.
  - [x] Create `src/app/(auth)/set-password/page.tsx`:
    - First-time invitation onboarding flow.
    - Token verification, password confirmation, 12+ character strength indicator.
  - [x] Create `src/app/(auth)/reset-password/page.tsx`:
    - Password reset fulfillment page handling reset tokens.

- [x] **1.8 Database Seeding Utility**
  - [x] Create `scripts/seed-admin.ts`:
    - Creates the initial super-admin account (`admin@trippygo.com`) if not present.
    - Creates a baseline salesperson account (`sales@trippygo.com`) for testing.
    - Directly hashes credentials and writes to PostgreSQL via Better Auth API.
  - [x] Add `"db:seed:auth": "tsx scripts/seed-admin.ts"` to `package.json`.

---

### Phase 1 Verification & Exit Gate
```bash
# 1. Run migrations and seed the initial users
npm run db:seed:auth

# 2. Start dev server and verify login endpoint
curl -X POST http://localhost:3000/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@trippygo.com","password":"AdminSecurePassword123!"}'
# Expected: 200 OK + Set-Cookie: trippygo_session

# 3. Verify public registration is blocked
curl -X POST http://localhost:3000/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{"email":"hacker@test.com","password":"Password12345!"}'
# Expected: 400 Bad Request with code: EMAIL_PASSWORD_SIGN_UP_DISABLED
```
- [x] Admin and salesperson can log in and out successfully through the `/login` UI.
- [x] 5 failed login attempts trigger the rate-limit lockout.
- [x] Password reset / invitation links output to console in local development and arrive via Resend when configured.
- [x] Automated Phase 1 verification test suite (`tests/security/auth-core.test.ts`) passes 100%.

---

## Phase 2: Database Schema Evolution & Ownership Model

### Objective
Evolve the relational database schema to link every itinerary to a distinct owner, establish audit fields, implement soft deletion, create an append-only audit log table, and upgrade the itinerary document schema to `schemaVersion: 2`.

### Technical Specifications
- **Foreign Keys:** Cascade rules and indexes on `owner_id`, `created_by`, `updated_by`, `deleted_by`.
- **Soft Deletion:** `deleted_at` timestamp with timezone. When present, the row is excluded from standard sales operations.
- **Audit Logging Table:** Immutable `audit_logs` table tracking sensitive events.
- **Schema Migration:** Increment `schemaVersion` from `1` to `2` in `src/lib/schema/migrate.ts`.

---

### Detailed Implementation Tasks & Checklist

- [x] **2.1 Schema Definition Updates (`src/db/schema.ts`)**
  - [x] Update `itineraries` table:
    - Add `ownerId`: `text("owner_id").notNull().references(() => user.id, { onDelete: "restrict" })`.
    - Add index on `owner_id` for fast scoped queries (`itineraries_owner_id_idx`).
    - Add `createdBy`: `text("created_by").references(() => user.id, { onDelete: "set null" })`.
    - Add `updatedBy`: `text("updated_by").references(() => user.id, { onDelete: "set null" })`.
    - Add `deletedAt`: `timestamp("deleted_at", { withTimezone: true })`.
    - Add `deletedBy`: `text("deleted_by").references(() => user.id, { onDelete: "set null" })`.
    - Add compound index on `(owner_id, deleted_at)` and `(deleted_at)`.
  - [x] Create `auditLogs` table:
    - `id`: `uuid("id").defaultRandom().primaryKey()`
    - `actorId`: `text("actor_id").references(() => user.id, { onDelete: "set null" })`
    - `action`: `text("action").notNull()` (e.g. `itinerary.create`, `itinerary.reassign`, `itinerary.soft_delete`, `itinerary.restore`, `pdf.generate`, `user.ban`)
    - `targetType`: `text("target_type").notNull()` (`itinerary`, `user`, `auth`)
    - `targetId`: `text("target_id").notNull()`
    - `metadata`: `jsonb("metadata").$type<Record<string, unknown>>()`
    - `ipAddress`: `text("ip_address")`
    - `createdAt`: `timestamp("created_at", { withTimezone: true }).defaultNow().notNull()`

- [x] **2.2 Audit Logging Helper Library**
  - [x] Create `src/lib/audit/logger.ts`:
    - `recordAuditEvent(event: { actorId?: string; action: string; targetType: string; targetId: string; metadata?: Record<string, unknown>; req?: Request }): Promise<void>`
    - Extracts IP and User-Agent safely.
    - Write asynchronously to PostgreSQL without blocking user request threads.

- [x] **2.3 Itinerary Schema Version 2 Upgrade**
  - [x] Update `src/lib/schema/itinerary.ts`:
    - Add optional `ownership` metadata to `Itinerary` type: `{ ownerId?: string; ownerName?: string; createdBy?: string }`.
  - [x] Update `src/lib/schema/migrate.ts`:
    - Support migration from `v1` to `v2`:
      - Set `doc.schemaVersion = 2`.
      - Normalize ownership audit fields if absent.
  - [x] Update `src/lib/schema/migrate.test.ts`:
    - Add unit tests verifying `v0 -> v2` and `v1 -> v2` transformations.

- [x] **2.4 Database Migration Execution**
  - [x] Run `npx drizzle-kit generate` to generate SQL migration scripts in `src/db/migrations/`.
  - [x] Apply migrations to PostgreSQL.
  - [x] Verify that `itineraries` and `audit_logs` match Drizzle schema definitions.

---

### Phase 2 Verification & Exit Gate
```bash
# 1. Run schema migration unit tests
npm run test:unit

# 2. Verify Drizzle schema compilation and migration status
npx drizzle-kit check
```
- [x] `migrateItinerarySchema` correctly outputs `schemaVersion: 2`.
- [x] `audit_logs` and updated `itineraries` tables are active in PostgreSQL with correct constraints and indexes.
- [x] Unit test suite passes without regressions.

---

## Phase 3: Server-Side Authorization Layer & Route Guarding

### Objective
Construct a centralized server-side data access layer enforcing ownership boundaries, update all Next.js API route handlers to perform role validation, implement the 404 anti-probing rule, and transition rate limiting to per-user keys.

### Technical Specifications
- **Security Boundary:** Data Access Layer (DAL) inside `src/lib/db/itineraries.ts`, supported by server action/route guards in `src/lib/auth/guard.ts`.
- **Anti-Probing Guarantee:** If a user requests a record where `owner_id != user.id` (and user is not an admin), the DAL must return `null`, translating to `404 Not Found`.
- **HMAC PDF Guard:** `POST /api/itineraries/[id]/generate` must verify caller ownership before creating the PDF render job and signing the HMAC token.
- **Middleware Role:** `src/middleware.ts` acts as a routing gate (redirecting unauthenticated users to `/login`), while the DAL acts as the authoritative security boundary.

---

### Detailed Implementation Tasks & Checklist

- [x] **3.1 Server Session & Guard Utilities**
  - [x] Create `src/lib/auth/guard.ts`:
    - `requireUser(req?: Request): Promise<{ user: User; session: Session }>`:
      - Validates session via `auth.api.getSession`.
      - Checks `user.banned`: if banned, immediately revokes session and throws 403 Forbidden.
      - Returns typed user and session.
    - `requireAdmin(req?: Request): Promise<{ user: User; session: Session }>`:
      - Calls `requireUser(req)`.
      - Checks `user.role === "admin"`. If not admin, throws 403 Forbidden.

- [x] **3.2 Centralized Data Access Layer Refactoring (`src/lib/db/itineraries.ts`)**
  - [x] Refactor all itinerary database functions to accept the authenticated `user: User`:
    - `listItineraries(user: User, options?: { search?: string; status?: string; ownerFilter?: string }): Promise<ItinerarySummary[]>`:
      - If `user.role === 'admin'`: query all records where `deleted_at IS NULL` (optional filter by `ownerFilter`).
      - If `user.role === 'salesperson'`: strictly query `WHERE owner_id = user.id AND deleted_at IS NULL`.
    - `getItinerary(id: string, user: User): Promise<Itinerary | null>`:
      - If `user.role === 'admin'`: fetch by `id` where `deleted_at IS NULL`.
      - If `user.role === 'salesperson'`: fetch by `id` where `id = id AND owner_id = user.id AND deleted_at IS NULL`.
      - If no row matches: return `null` (caller throws 404).
    - `saveItineraryData(id: string, data: Itinerary, user: User): Promise<void>`:
      - Check current record: must exist and be accessible to `user`. If not, throw 404.
      - Update row with `updated_by = user.id`, `updated_at = NOW()`.
      - Record `itinerary.update` audit event.
    - `createItinerary(id: string, data: Itinerary, user: User): Promise<void>`:
      - Insert row with `owner_id = user.id`, `created_by = user.id`, `updated_by = user.id`.
      - Record `itinerary.create` audit event.
    - `softDeleteItinerary(id: string, user: User): Promise<boolean>`:
      - Check ownership (admin or owner). If unauthorized, return false (404).
      - Set `deleted_at = NOW()`, `deleted_by = user.id`.
      - Record `itinerary.soft_delete` audit event.
    - `restoreItinerary(id: string, adminUser: User): Promise<boolean>`:
      - Admin-only operation.
      - Set `deleted_at = NULL`, `deleted_by = NULL`, `updated_by = adminUser.id`.
      - Record `itinerary.restore` audit event.
    - `reassignItinerary(id: string, newOwnerId: string, adminUser: User): Promise<boolean>`:
      - Admin-only operation.
      - Validate `newOwnerId` exists in `user` table.
      - Update `owner_id = newOwnerId`, `updated_by = adminUser.id`.
      - Record `itinerary.reassign` audit event.

- [x] **3.3 Route Handler Protection**
  - [x] Update `src/app/api/itineraries/route.ts`:
    - `GET`: Authenticate via `requireUser()`, return scoped list.
    - `POST`: Authenticate via `requireUser()`, stamp `owner_id = user.id`.
  - [x] Update `src/app/api/itineraries/[id]/route.ts`:
    - `GET`: Validate via `getItinerary(id, user)`. Return 404 if null.
    - `PUT`: Validate ownership. Return 404 if unowned.
    - `DELETE`: Execute `softDeleteItinerary(id, user)`. Return 404 if unowned.
  - [x] Update `src/app/api/itineraries/[id]/generate/route.ts`:
    - Verify caller owns the proposal (or is admin).
    - If unowned: return 404 immediately.
    - If authorized: mint HMAC token and call Chromium renderer service.
    - Record `pdf.generate` audit event.
  - [x] Update `src/app/api/extract/route.ts`, `src/app/api/flights/route.ts`, `src/app/api/images/route.ts`:
    - Require active session via `requireUser()`.
    - Key rate limiting directly to `user.id` instead of shared office IP.

- [x] **3.4 Next.js Middleware Updates (`src/middleware.ts`)**
  - [x] Protect `/admin/*` and `/api/admin/*`: redirect unauthenticated to `/login`, reject non-admin users with 403.
  - [x] Exclude public/render paths: `/api/auth/*`, `/login`, `/set-password`, `/reset-password`, `/print/*` (HMAC guarded), `/_next/*`, static assets.
  - [x] Forward `x-user-id` and `x-user-role` headers to downstream route handlers.

---

### Phase 3 Verification & Exit Gate
```bash
# 1. Run security tests
npm run test:security

# 2. Run pricing net-rate leakage audit
npm run test:leak
```
- [x] Salesperson A querying Salesperson B's proposal ID receives `404 Not Found`.
- [x] Salesperson attempting to call `/api/itineraries/[id]/generate` on an unowned proposal is rejected with 404.
- [x] Salesperson attempting to access `/admin/settings` is blocked with a 403 / redirected.
- [x] Banning a user in the database causes immediate 401/403 rejection on their subsequent requests.
- [x] `test:leak` passes with zero DMC net rates appearing in client payloads.

---

## Phase 4: Administrative UI & Operations Cockpit (Shadcn UI Preset `bKsFBxgG`)

### Objective
Deliver the administrative interfaces for managing agency sales staff, reassigning proposals, restoring deleted itineraries, viewing the audit ledger, and enhancing the header with user session management. The entire administrative dashboard is styled using the official **shadcn/ui** design system configured with preset code **`bKsFBxgG`** and OKLCH color token scales.

### Technical & Design Specifications
- **Design System & Preset:** `pnpm dlx shadcn@latest apply --preset bKsFBxgG`
- **Color Space:** Modern OKLCH color scales with `--radius: 0.625rem` and custom sidebar tokens (`--sidebar`, `--sidebar-primary`, etc.).
- **Typography & Layout:** High-contrast clean tables, accessible dialogs, badges, and dropdown menus matching the executive operations aesthetic while preserving TrippyGo's core brand tokens and `@media print` CSS.
- **Admin Views:**
  - Common Admin Layout (`src/app/admin/layout.tsx`): Shared sub-navigation tabs (`Settings`, `Staff Users`, `Trash / Restore`, `Audit Log`).
  - `/admin/users`: Staff directory, invite modal, role assignment, password reset, and deactivation.
  - `/admin/trash`: Soft-deleted proposal management with one-click restore.
  - `/admin/audit`: Append-only activity ledger.
- **Session Controls:** User profile dropdown in `WorkbenchHeader` utilizing shadcn `Avatar`, `DropdownMenu`, and Better Auth's `useSession()` / `signOut()`.

---

### Preset Design Tokens (`src/app/globals.css`)

The admin dashboard integrates the following CSS variable tokens generated by preset `bKsFBxgG`:

```css
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.147 0.004 49.25);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.147 0.004 49.25);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.147 0.004 49.25);
  --primary: oklch(0.488 0.243 264.376);
  --primary-foreground: oklch(0.97 0.014 254.604);
  --secondary: oklch(0.967 0.001 286.375);
  --secondary-foreground: oklch(0.21 0.006 285.885);
  --muted: oklch(0.97 0.001 106.424);
  --muted-foreground: oklch(0.553 0.013 58.071);
  --accent: oklch(0.97 0.001 106.424);
  --accent-foreground: oklch(0.216 0.006 56.043);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.923 0.003 48.717);
  --input: oklch(0.923 0.003 48.717);
  --ring: oklch(0.709 0.01 56.259);
  --chart-1: oklch(0.869 0.005 56.366);
  --chart-2: oklch(0.553 0.013 58.071);
  --chart-3: oklch(0.444 0.011 73.639);
  --chart-4: oklch(0.374 0.01 67.558);
  --chart-5: oklch(0.268 0.007 34.298);
  --radius: 0.625rem;
  --sidebar: oklch(0.985 0.001 106.423);
  --sidebar-foreground: oklch(0.147 0.004 49.25);
  --sidebar-primary: oklch(0.546 0.245 262.881);
  --sidebar-primary-foreground: oklch(0.97 0.014 254.604);
  --sidebar-accent: oklch(0.97 0.001 106.424);
  --sidebar-accent-foreground: oklch(0.216 0.006 56.043);
  --sidebar-border: oklch(0.923 0.003 48.717);
  --sidebar-ring: oklch(0.709 0.01 56.259);
}

.dark {
  --background: oklch(0.147 0.004 49.25);
  --foreground: oklch(0.985 0.001 106.423);
  --card: oklch(0.216 0.006 56.043);
  --card-foreground: oklch(0.985 0.001 106.423);
  --popover: oklch(0.216 0.006 56.043);
  --popover-foreground: oklch(0.985 0.001 106.423);
  --primary: oklch(0.424 0.199 265.638);
  --primary-foreground: oklch(0.97 0.014 254.604);
  --secondary: oklch(0.274 0.006 286.033);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.268 0.007 34.298);
  --muted-foreground: oklch(0.709 0.01 56.259);
  --accent: oklch(0.268 0.007 34.298);
  --accent-foreground: oklch(0.985 0.001 106.423);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.553 0.013 58.071);
  --chart-1: oklch(0.869 0.005 56.366);
  --chart-2: oklch(0.553 0.013 58.071);
  --chart-3: oklch(0.444 0.011 73.639);
  --chart-4: oklch(0.374 0.01 67.558);
  --chart-5: oklch(0.268 0.007 34.298);
  --sidebar: oklch(0.216 0.006 56.043);
  --sidebar-foreground: oklch(0.985 0.001 106.423);
  --sidebar-primary: oklch(0.623 0.214 259.815);
  --sidebar-primary-foreground: oklch(0.97 0.014 254.604);
  --sidebar-accent: oklch(0.268 0.007 34.298);
  --sidebar-accent-foreground: oklch(0.985 0.001 106.423);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.553 0.013 58.071);
}
```

---

### Detailed Implementation Tasks & Checklist

- [x] **4.1 Shadcn UI Setup & Preset Application**
  - [x] Apply the preset via the project runner:
    ```bash
    pnpm dlx shadcn@latest apply --preset bKsFBxgG
    ```
  - [x] Verify `components.json` is generated/updated with proper path aliases (`@/components/ui`).
  - [x] Update `src/app/globals.css` with the exact `:root` and `.dark` tokens above.
  - [x] Ensure TrippyGo's `@theme` tokens (`--color-brand-red`, `--color-brand-navy`, `--font-serif`, etc.) and `@media print` rules remain intact.

- [x] **4.2 Install Shadcn UI Primitives**
  - [x] Add the core UI primitives used in the admin cockpit:
    ```bash
    pnpm dlx shadcn@latest add table dialog dropdown-menu button badge input select card tabs separator avatar alert
    ```
  - [x] Verify components install cleanly into `src/components/ui/`.

- [x] **4.3 Shared Admin Layout & Navigation Tabs**
  - [x] Create `src/app/admin/layout.tsx`:
    - Enforce admin authentication via `requireAdmin()`.
    - Provide a unified admin header with breadcrumb navigation.
    - Provide sub-navigation tabs using shadcn `Tabs` / `TabsList` linking:
      - **Commercial Settings:** `/admin/settings`
      - **Staff Directory:** `/admin/users`
      - **Trash & Restore:** `/admin/trash`
      - **Audit Ledger:** `/admin/audit`
    - Styled using preset `--sidebar-*` and `bg-card` tokens.

- [x] **4.4 User Management Interface (`/admin/users`)**
  - [x] Create `src/app/admin/users/page.tsx`:
    - Fetch user list via `authClient.admin.listUsers()`.
    - Render staff directory using shadcn `Table`, `TableHeader`, `TableHead`, `TableBody`, `TableRow`, `TableCell`.
    - Display user details: Name, Email, Role `Badge` (Admin: `variant="default"`, Sales: `variant="secondary"`), Status `Badge` (Active: green accent, Banned: `variant="destructive"`), assigned itinerary count, last active date.
    - Table action triggers using shadcn `DropdownMenu`:
      - "Change Role"
      - "Send Password Reset Email"
      - "Deactivate / Ban User" (disabled for last active admin)
      - "Reactivate User"

- [x] **4.5 Administrative Modals**
  - [x] Create `src/components/admin/InviteUserModal.tsx`:
    - Composed with shadcn `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`.
    - Form fields using shadcn `Input`, `Select`, `Button`.
    - Dispatches invite via `/api/admin/users/invite` (Better Auth + Resend).
  - [x] Create `src/components/admin/ReassignProposalModal.tsx`:
    - Composed with shadcn `Dialog` and `Select` to choose a new proposal owner.
    - Updates ownership via `PATCH /api/admin/itineraries/[id]/reassign`.

- [x] **4.6 Trash Management & Proposal Restore (`/admin/trash`)**
  - [x] Create `src/app/admin/trash/page.tsx`:
    - Display soft-deleted itineraries using shadcn `Table`.
    - Show Itinerary Title, Original Owner, Deletion Date, Deleted By.
    - One-click "Restore Itinerary" button with `variant="outline"`.

- [x] **4.7 Audit Ledger Viewer (`/admin/audit`)**
  - [x] Create `src/app/admin/audit/page.tsx`:
    - Composed using shadcn `Card`, `CardHeader`, `CardTitle`, `CardContent`, and `Table`.
    - Filters: Action type, Actor, Date range.
    - Read-only historical ledger of all authentication and proposal modification events.

- [x] **4.8 Session Controls in Global Header**
  - [x] Update `src/components/dashboard/WorkbenchHeader.tsx`:
    - Composed using shadcn `Avatar`, `AvatarFallback`, `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuSeparator`.
    - Show user avatar with fallback initials, user name, role badge.
    - Actions: "Agency Settings" (admin), "Staff Directory" (admin), "Change Password", and "Sign Out".

---

### Phase 4 Verification & Exit Gate
- [x] Admin can invite a new salesperson via `/admin/users`; invitation email is generated.
- [x] Salesperson accepts invite, sets password, and logs in.
- [x] Admin can reassign a proposal from one salesperson to another, and the proposal immediately shifts visibility between user dashboards.
- [x] Admin can soft-delete a proposal, view it in `/admin/trash`, and restore it.
- [x] Last active admin cannot be deactivated or demoted (UI and API reject attempt).

---

## Phase 5: Security Audits, Comprehensive Testing & Production Hardening

### Objective
Implement automated authorization integration tests, ensure zero client secret leaks, update end-to-end tests with authenticated sessions, and verify full production readiness.

### Technical Specifications
- **Test File:** `tests/security/authorization.test.ts`
- **Secrets Audit:** Update `tests/security/api-keys.test.ts` with Better Auth and Resend secret tokens.
- **E2E Suite:** Update `tests/e2e/itinerary-flow.test.ts` to log in before creating and exporting proposals.

---

### Detailed Implementation Tasks & Checklist

- [x] **5.1 Automated Authorization Security Test Suite**
  - [x] Create `tests/security/authorization.test.ts`:
    - Test 1: Cross-user proposal access returns 404 (GET, PUT, DELETE).
    - Test 2: Salesperson cannot generate PDF for unowned proposal (404 returned, no HMAC minted).
    - Test 3: Salesperson cannot access `/admin/*` routes or admin API handlers (403 returned).
    - Test 4: Banned user session is rejected on subsequent request.
    - Test 5: Soft-deleted proposal is hidden from salesperson list but visible in admin trash.
    - Test 6: Last remaining admin cannot be demoted or banned.
  - [x] Add `"test:auth": "tsx tests/security/authorization.test.ts"` to `package.json`.
  - [x] Add `npm run test:auth` to the main `npm test` script.

- [x] **5.2 Credential & Secret Leak Guarding**
  - [x] Update `tests/security/api-keys.test.ts`:
    - Add `BETTER_AUTH_SECRET`, `RESEND_API_KEY`, and `DATABASE_URL` to forbidden client-side secrets list.
    - Verify that no client components bundle server auth logic.

- [x] **5.3 End-to-End Test Suite Adaptation**
  - [x] Update `tests/e2e/itinerary-flow.test.ts`:
    - Prepend authenticated session cookie / test user login before executing the proposal creation, flight search, and PDF generation sequence.

- [x] **5.4 Deployment & Operational Documentation**
  - [x] Update `README.md` and `ARCHITECTURE.md` with:
    - Authentication architecture details.
    - Required production environment variables (`BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `RESEND_API_KEY`, `EMAIL_FROM`).
    - Initial seeding procedure for new production instances (`npm run db:seed:auth`).

---

### Phase 5 Verification & Final Release Gate
```bash
# Run the complete test suite
npm run test
```
The implementation is officially complete when:
- [x] `npm run test:unit` passes (Schema migration v2 and pricing tests).
- [x] `npm run test:security` passes (API key scans, upload validation, network isolation, and authorization tests).
- [x] `npm run test:leak` passes (Client proposal payload verified 100% free of DMC net rates).
- [x] `npm run test:e2e` passes (Full browser flow with logged-in user).
- [x] `npm run build` succeeds without TypeScript or ESLint errors.

---

## 4. Rollout & Risk Mitigation Matrix

| Risk Scenario | Probability | Impact | Mitigation Strategy |
|---|---|---|---|
| **DMC Net Rate Leak in Auth Payloads** | Low | Critical | All user data responses use typed DTOs. Net pricing calculations remain exclusively within `computeClientView()` which runs in server-only modules. |
| **Accidental ID Probing by Sales Staff** | Medium | High | Strict Data Access Layer filtering: queries return `404 Not Found` for unowned itineraries, never `403 Forbidden`. |
| **Admin Lockout (Zero Active Admins)** | Low | High | API and DB triggers prevent banning, deleting, or demoting the last active administrator. |
| **Resend Outage / Email Failure** | Low | Medium | Local dev falls back to console logging; production displays explicit admin UI error alerts with retry triggers. |
| **Chromium Renderer Performance Impact** | Low | Low | Headless renderer remains decoupled, receiving only short-lived HMAC tokens. Auth overhead on PDF generation is sub-5ms. |

---

## 5. Summary of Files Created & Modified

### New Files
- `src/lib/auth/index.ts` — Better Auth server configuration
- `src/lib/auth/client.ts` — Better Auth React client instance
- `src/lib/auth/guard.ts` — `requireUser` and `requireAdmin` server guards
- `src/lib/audit/logger.ts` — Structured audit logging engine
- `src/lib/email/resend.ts` — Resend email dispatch service
- `src/lib/email/templates/InvitationEmail.tsx` — Editorial invitation email template
- `src/lib/email/templates/PasswordResetEmail.tsx` — Password reset email template
- `src/app/api/auth/[...all]/route.ts` — Better Auth catch-all route handler
- `src/app/(auth)/login/page.tsx` — Editorial login screen
- `src/app/(auth)/set-password/page.tsx` — First-time invitation password setup
- `src/app/(auth)/reset-password/page.tsx` — Password reset fulfillment
- `src/app/admin/layout.tsx` — Shared admin sub-navigation tabs & role guard
- `src/app/admin/users/page.tsx` — Admin staff directory & user management
- `src/app/admin/trash/page.tsx` — Deleted proposal restore interface
- `src/app/admin/audit/page.tsx` — Activity audit ledger viewer
- `src/components/admin/InviteUserModal.tsx` — Shadcn Dialog for inviting staff
- `src/components/admin/ReassignProposalModal.tsx` — Shadcn Dialog for transferring proposals
- `src/components/ui/*` — Shadcn UI primitives (`table`, `dialog`, `badge`, `dropdown-menu`, etc.)
- `scripts/seed-admin.ts` — Initial admin & salesperson database seeder
- `tests/security/authorization.test.ts` — RBAC & anti-probing integration tests

### Modified Files
- `src/app/globals.css` — Integrated shadcn preset `bKsFBxgG` OKLCH tokens (`:root` & `.dark`)
- `src/db/schema.ts` — User, session, account, verification, audit log tables, and itinerary ownership fields
- `src/lib/db/itineraries.ts` — Scoped queries, soft-deletion, and ownership checks
- `src/lib/schema/itinerary.ts` — Ownership metadata definitions
- `src/lib/schema/migrate.ts` — Version 2 schema migration
- `src/middleware.ts` — Route shielding and redirects
- `src/components/dashboard/WorkbenchHeader.tsx` — Session controls, profile dropdown, sign-out
- `src/app/api/itineraries/route.ts` — Scoped listing and owner stamping
- `src/app/api/itineraries/[id]/route.ts` — Ownership validation & soft-delete
- `src/app/api/itineraries/[id]/generate/route.ts` — Pre-generation ownership validation
- `tests/security/api-keys.test.ts` — Auth secret scanning
- `package.json` — New scripts and dependencies
