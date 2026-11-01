# Home Page Workbench Redesign — Implementation Plan

> **TrippyGo Itinerary Generator**  
> **Document:** `docs/HOMEPAGE_WORKBENCH_REDESIGN_PLAN.md`  
> **Aesthetic Archetype:** Impeccable Operate Mode (Bespoke Editorial Luxury / Workstation Precision)  
> **Target Surface:** `src/app/page.tsx` & supporting API routes / components  
> **Status:** Strategic Architecture & Phased Blueprint  

---

## Executive Summary & Problem Diagnosis

### The Core Problem: Surface Mode Misclassification
The current front page (`src/app/page.tsx`) suffers from **"marketing landing page syndrome" on an internal B2B productivity tool**:
1. **Wrong Audience & Intent (Persuade vs. Operate):** Sales advisors use this application dozens of times a week. They do not need marketing hero copy ("Generate Client-Ready Travel Itineraries with Ease"), glowing gradient halos, or value-proposition cards explaining what the company's internal software does.
2. **Zero Operational Memory (No Proposal History):** Once a salesperson creates an itinerary, it disappears into backend storage. The homepage provides no dashboard, no search, no draft status, and no way to resume or re-download recent proposals without knowing the raw URL.
3. **Cluttered & Discordant Input UI:** File upload and WhatsApp paste inputs are jammed side-by-side inside a single constrained container with terminal-style monospaced text.
4. **Visual Identity Divergence:** While TrippyGo's PDF engine is built around a prestigious editorial identity (warm ivory canvas `#fafaf7`, architectural navy `#091c3e`, and heritage red `#c92229`), the homepage is styled in pitch-black gaming dark mode (`slate-950`) with neon blurs.

### The Impeccable Philosophy (Mode: Operate / Technique: Distill & Layout)
Per the `/impeccable` design specifications:
> *"When design SERVES the product: app UIs, admin dashboards, settings panels, data tables, tools... The test is whether a category-fluent user can trust the interface immediately or must pause at every subtly-off component. Product UI's failure mode isn't flatness, it's strangeness without purpose. The tool should disappear into the task."*

---

## 1. Information Architecture & Mental Model

### Before: Marketing Hero with Split Input
```
┌────────────────────────────────────────────────────────────────────────┐
│ NAVBAR: Logo [T] TrippyGo                        [Settings] [Blank]    │
├────────────────────────────────────────────────────────────────────────┤
│ (Ambient 3xl Glow Background)                                          │
│                                                                        │
│   ✨ Turn Supplier Quotes Into Branded PDFs in Seconds [EYEBROW]       │
│   Generate Client-Ready Travel Itineraries with Ease. [HERO TITLE]     │
│   Upload any supplier PDF or paste WhatsApp/DMC text...                │
│                                                                        │
│   ┌──────────────────────────────────────────────────────────────────┐ │
│   │ [Drop PDF here or click]       │ [Monospace Textarea]            │ │
│   │                                │                                 │ │
│   │ Quick Test: Kashmir Sample     │ [Extract & Open Editor ->]      │ │
│   └──────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│   ┌───────────────┐        ┌───────────────┐        ┌────────────────┐ │
│   │ Zero Supplier │        │ Two-Pane Live │        │ Indian GST &   │ │
│   │ Leaks         │        │ Editor        │        │ Pricing Ready  │ │
│   └───────────────┘        └───────────────┘        └────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

### After: High-Density Executive Workbench
```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│ TRIPPYGO  |  Sales Operations Console      [Search proposals... ⌘K]  [Settings] [+ New] │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│ METRICS:  14 Active Proposals  |  8 Client PDFs Generated  |  ₹24,80,000 Pipeline Value  │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│ RECENT ITINERARIES & CLIENT PROPOSALS                          [Filter: All | Draft | Final]
│                                                                                         │
│ Proposal / Client       Destination       Dates          Price (₹)    Status    Actions │
│ ─────────────────────────────────────────────────────────────────────────────────────── │
│ Sharma Family Holiday   Kashmir (6N/7D)   Nov 15 - 22    ₹1,42,000    [Draft]   [Edit]  │
│ Maldives Luxury Escape  Male / Maafushi   Dec 02 - 07    ₹3,85,000    [Final]   [PDF]   │
│ Golden Triangle Tour    Delhi, Agra, JAI  Jan 10 - 16    ₹98,000      [Draft]   [Edit]  │
│ Vietnam Highlights      Hanoi, Da Nang    Feb 05 - 14    ₹2,10,000    [Final]   [PDF]   │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### New Intake Experience: Dedicated Intake Modal / Drawer
Triggered by the primary `[+ New Itinerary]` button (or automatically if zero proposals exist):
- **Tab 1: Upload Supplier Document** (PDF / TXT with drag-and-drop indicator & size validation).
- **Tab 2: Paste WhatsApp / Email Quote** (Clean typography, auto-expanding textarea, sample shortcut).
- **Tab 3: Start Blank** (Instant creation without AI processing).

---

## 2. Phased Implementation Roadmap

### Phase 1: Backend Data Access & Listing Endpoints — ✅ COMPLETED
**Objective:** Provide robust, ordered listing and retrieval of existing itineraries supporting both PostgreSQL and local file storage.

1. **`src/lib/db/itineraries.ts` — Add `listItineraries()`**
   - Query all itineraries ordered by `updatedAt DESC`.
   - In PostgreSQL: `db.select().from(itineraries).orderBy(desc(itineraries.updatedAt))`.
   - In Local Store fallback (`.data/itineraries.json`): Read all records from `store.itineraries`, sort descending by `updatedAt`.
   - Return clean summary objects:
     ```ts
     export interface ItinerarySummary {
       id: string;
       title: string;
       status: "draft" | "generated" | "archived";
       guestName?: string;
       destinations: string[];
       daysCount: number;
       nightsCount: number;
       startDate?: string;
       totalAmountPaise?: number;
       updatedAt: string;
       createdAt: string;
       latestPdfKey?: string;
     }
     ```
2. **`src/app/api/itineraries/route.ts` — Implement `GET` Method**
   - Call `listItineraries()`.
   - Support optional query parameters: `search` (case-insensitive substring match on title, client name, or destination), `status`, `limit`, `offset`.
3. **`src/app/api/itineraries/[id]/route.ts` — Add `DELETE` Support**
   - Allow sales reps to archive or delete outdated proposals.

---

### Phase 2: Design Token & Visual Unification — ✅ COMPLETED
**Objective:** Replace the pitch-black gamer aesthetic with TrippyGo’s approved editorial workstation palette.

1. **Canvas & Surfaces:**
   - Background: Light canvas `#f8fafc` with subtle ivory warmth `#fafaf7`.
   - Surface cards / tables: Pure white `#ffffff` with crisp hairline borders `#e2e8f0`.
2. **Typography System:**
   - Display/Titles: `Cormorant Garamond` (editorial prestige for key metrics and headers).
   - Data & UI Controls: `Plus Jakarta Sans` (print-dense, geometric, highly legible).
3. **Color Accents & Hierarchy:**
   - Primary Headings & Structure: Deep architectural navy `#091c3e`.
   - Focal Accent & Badges: Heritage red `#c92229` (for primary actions and price callouts).
   - Status Tokens:
     - `Draft`: Subtle slate/amber badge (`bg-amber-50 text-amber-800 border-amber-200`).
     - `Generated/Ready`: Crisp emerald badge (`bg-emerald-50 text-emerald-800 border-emerald-200`).
4. **Craft-Floor Enforcement:**
   - Removed all glowing `blur-3xl` background divs.
   - Deleted eyebrow marketing badges (`Turn Supplier Quotes...`).
   - Removed the 3 SaaS feature cards.
   - Replaced monospace textarea with standard readable text input.

---

### Phase 3: Executive Workbench Dashboard Component Architecture — ✅ COMPLETED
**Objective:** Build the scannable, high-density homepage workspace in `src/app/page.tsx` and modular components.

1. **`WorkbenchHeader` Component:**
   - Brand lockup with TrippyGo logo and "Operations" badge.
   - Interactive search input with keyboard shortcut hint (`⌘K` / `Ctrl+K`).
   - Action buttons: `[Settings]` and high-contrast `[+ New Itinerary]` (Heritage red `#c92229`).
2. **`WorkbenchMetrics` Component:**
   - 3 clean, uncluttered counters:
     - **Active Drafts** (count)
     - **Ready Client PDFs** (count)
     - **Total Pipeline Quoted** (formatted in Indian ₹ with comma system)
   - Quick segmented control filters: `All`, `PDF Ready`, `Drafts`.
3. **`ItineraryTable` Component:**
   - Desktop view: Clean tabular layout with columns:
     - **Proposal Name & Client** (bold title + guest name).
     - **Destinations & Duration** (e.g., *Kashmir • 6N/7D*).
     - **Travel Dates** (formatted start date).
     - **Selling Price** (Indian Rupee formatting: ₹1,42,000).
     - **Status Badge** (*Draft* vs. *PDF Ready*).
     - **Quick Actions:** *Open in Editor*, *View PDF* (direct link if generated), and confirmable *Delete*.
   - Mobile/Tablet view: Responsive stacked card view maintaining all actions and status.
4. **`WorkbenchEmptyState` Component:**
   - Shown when zero proposals exist in the database or when search yields zero matches.
   - Clean instructional copy and one-click Kashmir tour sample shortcut.

---

### Phase 4: Streamlined Intake Experience (Modal / Drawer) — ✅ COMPLETED
**Objective:** Provide a fast, distraction-free ingestion workflow for supplier files and quotes.

1. **`NewItineraryModal` Component:**
   - Accessible modal overlay with clean tabs:
     - **Tab 1: Upload Supplier Document** (Dedicated dropzone for `.pdf` and `.txt`, max 50MB, with drag-over visual feedback and filename display).
     - **Tab 2: Paste WhatsApp / DMC Quote** (Expansive, clean multiline text area with clear formatting instructions and sample loader).
     - **Tab 3: Blank Proposal** (One-click jump into empty editor).
2. **Real-Time Extraction Feedback:**
   - Animated progress indicator with step messaging ("Parsing with Claude AI...").
   - Clear error recovery banner if extraction fails (retaining pasted text so sales reps don't lose their input).
3. **Direct Navigation:**
   - On successful extraction and save, redirect immediately to `/itineraries/[id]/edit`.

---

### Phase 5: Verification, A11y & Impeccable Quality Checks — ✅ COMPLETED
**Objective:** Verify compliance with Impeccable craft standards, keyboard usability, and test suites.

1. **Contrast & Accessibility (WCAG AA):**
   - Verified all text elements meet ≥ 4.5:1 contrast against `#ffffff` and `#f8fafc`.
   - Verified interactive controls have visible focus rings (`focus-visible:ring-2 focus-visible:ring-[#091c3e]`).
   - Implemented keyboard shortcuts: `Escape` closes modal, `⌘K` / `Ctrl+K` focuses search input.
2. **Mechanical Detection:**
   - Ran Impeccable detector on all components: 0 findings (`[]`).
3. **Regression Testing:**
   - Ran test suite: `npm run test:unit`, `npm run test:dates`, `npm run test:security`, `npm run test:docker`, `npm run test:leak` — ALL PASSED 100%.

---

## 3. File Modification & Creation Summary

| File | Operation | Purpose |
| :--- | :--- | :--- |
| `docs/HOMEPAGE_WORKBENCH_REDESIGN_PLAN.md` | **Create** | This blueprint document |
| `src/lib/db/itineraries.ts` | **Modify** | Add `listItineraries()` and `deleteItinerary()` |
| `src/app/api/itineraries/route.ts` | **Modify** | Add `GET` endpoint for listing proposals |
| `src/app/api/itineraries/[id]/route.ts` | **Modify** | Add `DELETE` endpoint |
| `src/app/page.tsx` | **Modify** | Complete overhaul into executive workbench dashboard |
| `src/components/dashboard/` | **Create** | Modular workbench components (`WorkbenchHeader`, `ItineraryTable`, `NewItineraryModal`, etc.) |

---

## 4. Rollout Strategy & Fallbacks

- **Zero-Risk Data Compatibility:** `listItineraries()` gracefully checks PostgreSQL first, then falls back to `.data/itineraries.json`. If no data exists, it renders the elegant empty state.
- **Preserved Existing Workflows:** The extraction logic (`handleExtract`), Kashmir sample demo, and blank creation logic are 100% preserved inside the new `NewItineraryModal`.
- **Zero Editor Interruption:** No changes to `/itineraries/[id]/edit` or the Playwright PDF rendering engine are required.
