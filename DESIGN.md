# TrippyGo Application Design Specification (DESIGN.md)

> **Authority:** Derived strictly from `docs/UI_DECISIONS.md` and owner decisions (2 Nov 2026).
> **Scope:** TrippyGo Application Web UI only.
> **Status:** Single source of visual and interaction truth for the application interface.
> **Strict Directive:** Do not extract design rules from legacy application code. The application UI is built with shadcn/ui components, Inter typography, and preset design tokens.

---

## 1. The Frozen Zone: Client PDF & Live Preview Isolation

**Absolutely zero changes to the client PDF and to the rendered document inside the preview pane.**
Not in layout, fonts, colours, spacing, text, page count, or page breaks.

### 1.1 Protected Paths
Never edit, restyle, reformat, or "clean up":
- `src/templates/itinerary/**` (all print and preview templates)
- `src/app/print/**` (the HMAC print route)
- `services/renderer/**`
- `public/fonts/**` (Cormorant Garamond, Plus Jakarta Sans, Caveat stay exactly as they are)
- Any CSS, Tailwind classes, or tokens used by the above
- The rendered A4 document shown inside the editor's preview pane

### 1.2 Isolation & Verification Requirements
1. **CSS Containment:** The application's new global CSS (shadcn tokens, Inter font, Tailwind preflight, `--radius`, etc.) must **never** be imported by the print route (`/print/[id]`) or applied to the rendered preview content. Scope application styles to the application shell.
2. **Theme Protection:** The new application theme must not override any styles the print/preview templates rely on (font families, base font size, line height, border styles, brand colors).
3. **Pull Request Quality Gate:** Every pull request must run `npm run test:visual` (8 golden benchmark PDFs) and produce **zero pixel difference**, and `npm run test:leak` must pass. Also take before/after screenshots of the preview pane to confirm the rendered document inside is identical.
4. **Zero Tolerance:** If any visual difference appears in the PDF or preview document, the change is wrong and must be reverted. Baselines must never be updated to force a test pass.

---

## 2. Global Design System & Tokens

### 2.1 Component Foundation: shadcn/ui
All application UI is built using shadcn/ui primitives from `components/ui`. Hand-rolled buttons, inputs, selects, dialogs, tabs, tables, badges, tooltips, dropdown menus, accordions, toggles, or toasts are strictly banned when a shadcn component exists.

Preset code applied for foundation:
```bash
npx shadcn@latest apply --preset bKsFBxgG
```

### 2.2 Color Tokens & System
- **Single Source of Truth:** Colors are derived exclusively from the shadcn preset tokens. Raw hex values and brand colors (Navy `#091c3e`, Heritage Red `#c92229`, Ivory `#fafaf7`) are **banned** from the application UI; they belong exclusively to the frozen PDF.
- **Surface Palette:** Clean white surfaces (`--background`, `--card`, `--popover`), neutral borders (`--border`, `--input`), and subtle muted grays (`--muted`, `--muted-foreground`).
- **Primary Accent:** Single blue `--primary` token (`oklch(0.488 0.243 264.376)`) reserved for the one primary action per screen.
- **Destructive:** `--destructive` (`oklch(0.577 0.245 27.325)`) reserved strictly for destructive confirmations (e.g., delete) and critical errors.
- **Semantic Extras:** Two dedicated status tokens added in matching OKLCH format, used sparingly:
  - `--warning`: `oklch(0.769 0.188 70.08)` (Amber for review flags, long layover notices, and low-margin warnings). Orange is never used for ordinary values, tabs, or standard inputs.
  - `--success`: `oklch(0.627 0.194 149.214)` (Green for "PDF ready" status).
- **Theme Mode:** Light mode only for current implementation. Dark mode tokens remain in global CSS but theme toggles are not exposed.

### 2.3 Preset CSS Tokens (from preset `bKsFBxgG`)

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

  /* Semantic status additions */
  --warning: oklch(0.769 0.188 70.08);
  --warning-foreground: oklch(0.2 0.05 70);
  --success: oklch(0.627 0.194 149.214);
  --success-foreground: oklch(0.98 0.01 149);
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

## 3. Typography: Inter Only

**Inter** is the sole typeface used across the application UI, loaded via `next/font/google`.

### 3.1 Two Fixed Weights
1. **Regular (400):** Body paragraphs, input text, table content, descriptive copy.
2. **SemiBold (600):** Headings, active states, emphasized prices, button labels.

### 3.2 Fixed Application Type Scale

| Token / Class | Size | Line Height | Weight | Typical Use |
| :--- | :--- | :--- | :--- | :--- |
| `text-xs` | 12px (`0.75rem`) | 16px | 400 / 600 | Metadata, timestamps, badges, field captions |
| `text-sm` | 14px (`0.875rem`) | 20px | 400 / 600 | Body text, standard table cells, inputs, button labels |
| `text-base` | 16px (`1rem`) | 24px | 400 / 600 | Subheadings, card titles, section headers |
| `text-lg` | 18px (`1.125rem`) | 28px | 600 | Panel titles, modal titles |
| `text-xl` | 20px (`1.25rem`) | 28px | 600 | Page titles (Dashboard, Settings, Editor) |
| `text-2xl` | 24px (`1.5rem`) | 32px | 600 | Emphasized client quotation totals |

---

## 4. Spacing, Geometry & Radius

### 4.1 Fixed Spacing Scale
- `space-1` = 4px (`0.25rem`) — Micro icon/text gaps
- `space-2` = 8px (`0.5rem`) — Tight component internal padding
- `space-3` = 12px (`0.75rem`) — Standard input and item padding
- `space-4` = 16px (`1rem`) — Card padding, standard grid gaps
- `space-6` = 24px (`1.5rem`) — Section vertical spacing
- `space-8` = 32px (`2rem`) — Major panel dividing spacing

### 4.2 Uniform Radius
- Baseline: `--radius: 0.625rem` (10px)
- Applied uniformly across cards (`rounded-lg`), inputs (`rounded-md`), dialogs (`rounded-lg`), and buttons (`rounded-md`).

---

## 5. Component Interaction & Button Rules

### 5.1 shadcn Button Variants Only
All buttons strictly use shadcn `Button` variants:
- `default` (Primary): Solid blue `--primary` fill with white text.
- `outline` (Secondary): Bordered with neutral `--border`, hover with `--accent`.
- `ghost` / `icon`: Clean text or icon target without default border.
- `destructive`: Reserved for delete confirmation modals only.

### 5.2 The One-Primary-Per-Screen Rule
- **Strict Limit:** Exactly **one** `default` (primary) button is permitted per visible screen, panel, or modal.
- If a primary action exists in a header or footer, all secondary actions within that view must be `outline` or `ghost`.
- No visual competition between multiple solid filled buttons.

### 5.3 Universal "+ Add" Pattern
Every list insertion workflow across the app adheres to a single uniform pattern:
1. An input box where typing and pressing `Enter` adds the item.
2. A small adjacent `ghost` button: `+ Add [Item]`.
- **Banned:** Split dropdown buttons, double plus signs (`+ + Layover`), custom pills, or multi-colored action bars.

---

## 6. Copy & Formatting Rules

- **Field Labels:** 1 to 3 words maximum (`Package title`, `Trip start date`, `Rooms`).
- **Helper Text:** Single-line maximum, placed only where the field is prone to user error.
- **Jargon Elimination:** Banned technical jargon in visible UI:
  - Remove `"1:1.414"`, `"A4 Editorial Luxury Spec"`. Use `"Cover photo"`.
  - Remove `"SHA-256"`, `"immutable"`, `"cryptographic hash"`. Use `"PDF history"`.
  - Remove `"Safe zone 20-65%"`. Use `"Keep subject centered"`.
  - Remove `"Sector"` and `"Leg"`. Use `"Flight"`.
- **Honest Data:** Never show a number the application cannot back up (e.g., remove unbacked `"₹0"` pipeline metrics).
- **Universal Currency Format:** `₹1,07,985` (rupee symbol, no space, standard Indian numbering format).
- **Disclosure Depth:** Maximum of two levels (main screen -> collapsible/modal). Never nest accordions within accordions or dialogs within dialogs.

---

## 7. Per-Screen Specifications (All 15 Screens)

### 7.1 Screen 1: Home Dashboard (`/`)

- **Keep:**
  - Search (`⌘K`, shadcn `Command` or `Input`).
  - "+ New itinerary".
  - shadcn `Table` with columns: Proposal and client, Destinations and dates (e.g. "Phuket, Krabi · 5 Nov · 7N/8D"), Price, Status, Updated.
  - Status `Badge` (Draft / PDF ready).
  - Filter via `Tabs`/`ToggleGroup`: All / Drafts / PDF ready.
  - Row actions: row click opens the editor; PDF icon button.
- **Hide:**
  - Duplicate and Delete go into a row `DropdownMenu` ("…"). Delete is soft.
  - Settings goes into a user menu (admin only).
  - KPI strip is admin-only, reduced to "PDFs ready" and "Drafts".
- **Cut:**
  - "OPERATIONS" tag and the "B2B Proposal & Itinerary Engine" subtitle.
  - "Showing 49 of 49 proposals".
  - "TOTAL PROPOSALS" card.
  - "TOTAL PIPELINE QUOTED" card: hidden until the ₹0 bug is fixed, then admin-only.
  - The text "Edit" button (row click replaces it).
  - Separate start-date line.
- **Other:** Paginate (20 rows per page). "Unpriced Draft" becomes "—". Empty state: one sentence plus the "New itinerary" button.
- **Primary action:** `+ New itinerary`

---

### 7.2 Screen 2: Agency Settings (`/admin/settings`, admin only)

- **Keep:**
  - Default markup type and value.
  - Minimum margin floor.
  - Selling price rounding.
  - Quote validity (days).
  - GST display mode.
  - Agency GSTIN.
  - "Allow salespeople to change markup" `Switch`. Behaviour unchanged: margin permissions are not being modified.
  - Back button and Save.
- **Hide:**
  - "Tax compliance (advanced)" `Accordion`: SAC code, TCS 206C switch.
- **Cut:**
  - "GLOBAL POLICY" tag.
  - Section subtitles that repeat the section title.
  - Orange styling on the margin-floor input (fix as a bug).
  - "Governance" wording. Use "Margins", "Tax", "Salespeople".
- **Other:** Save is sticky and enabled only when something changed. Label the page "Settings". Agency name/logo fields are out of scope for this pass.
- **Primary action:** `Save changes`

---

### 7.3 Screen 3: Editor Shell, Tabs and Review Banner

- **Keep:**
  - Back, title, trip subtitle, autosave status, undo/redo (small icon buttons).
  - Five tabs: Overview, Flights, Days, Inclusions, Pricing.
  - Generate Client PDF.
  - Review banner (compact).
- **Hide:**
  - "Versions" goes into a "…" menu, renamed "PDF history".
  - Keyboard shortcuts go into a tooltip or help menu.
- **Cut:**
  - "Step 1 of 5 • Shortcut Ctrl+1-5" line.
  - Numeric prefixes "1." to "5." on tabs.
  - Numeric orange count badges on tabs.
  - The "Auto-clears" pill.
  - "Previous Step" button.
- **Replace:**
  - Tab badges become a single small amber dot when a tab contains unreviewed extracted fields.
  - Review banner becomes: "7 fields to review" (shadcn `Alert`) with a **Review next** button that jumps through gold-bordered fields. It dismisses itself at zero. Do not change the gold-border behaviour of the fields themselves.
  - Bottom bar keeps only "Next: Flights →" as an `outline`/`ghost` button.
- **Primary action:** `Generate Client PDF`

---

### 7.4 Screen 4: Editor Tab: Overview

Group into three labelled sections, top to bottom:
- **Keep:**
  - *Trip:* package title, guest name, destinations (chips plus input).
  - *Dates & travellers:* nights, days, start date, end date (read-only text), adults, children, infants, rooms.
  - *Cover photo:* thumbnail plus "Change cover".
- **Hide:**
  - "Your contact details" (specialist name, phone, email): collapsed, prefilled from the user profile.
- **Cut:**
  - "A4 Portrait (1:1.414)" badge.
  - "Auto-syncs Days/Nights" and "Based on Start + Nights" subtitles. Replace with one tooltip: "Days and nights stay in sync."
  - Preset quick-pick pills on this tab (they live in the cover picker).
  - Fallback warning wording. Replace with: "Using a photo from Day 1. Choose a cover for a stronger first page."
  - The "+ Add" button for destinations becomes a small ghost "Add".
- **Primary action:** `none (Next →)`

---

### 7.5 Screen 5: Editor Tab: Flights

- **Keep:**
  - Two groups: Going and Return.
  - Compact flight rows: airline, date, DEP→ARR with times, duration/stops, baggage.
  - One "+ Add flight" control with a small menu: Find flights / Add manually / Auto-suggest.
  - Layover notices between flights (derived automatically).
- **Hide:**
  - Clear all, reorder, delete, and "Add layover note" go into each row's "…" menu (reorder also by drag).
  - Row edit fields expand inline when the row is clicked; make this obvious with a chevron.
- **Cut:**
  - Route breadcrumb "DEL → DEL (4 Stops via KUL, HKT, KUL, KUL)".
  - "5 Flight Sectors" badge and the Page 3 subtitle.
  - Three different add buttons and "+ + Layover".
  - The words "sector" and "leg" everywhere: use "flight".
- **Other:** An empty or incomplete extracted flight (e.g. "Airline: Airline", 00:00) gets the review state, not silence. Layover severity: under 6h neutral, 6-12h amber, overnight/over 12h strong amber with "Check stay". Do not change how flights render in the PDF.
- **Primary action:** `+ Add flight`

---

### 7.6 Screen 6: Editor Tab: Days

- **Keep:**
  - Left: vertical list of all days ("Day 1 · Coco Island"), each with a status dot (hotel / photo missing). Right: editor for the selected day. On narrow screens, an `Accordion`.
  - Fields: day title, narrative, hotel, city, room type.
  - Meals: three `Toggle`s with an unmistakable on/off state (check icon when on). No trailing "+".
  - Activities: chips plus input.
- **Hide:**
  - Day photo: collapsed "Photo (optional)" with "Choose photo".
  - Quick-add activity pills: collapsed under "Suggestions".
  - Duplicate / delete / collapse day: "…" menu.
- **Cut:**
  - "8 Days Total" badge and panel subtitle.
  - Per-day "Changes autosave instantly" note.
  - The `#01 EDITING DAY 1 OF 8` banner (the selected list item already shows it).
  - Large empty "No Photo Selected" box. Photo is explicitly optional.
- **Primary action:** `+ Add day`

---

### 7.7 Screen 7: Editor Tab: Inclusions

- **Keep:**
  - Two columns: Included, Excluded.
  - Editable rows (multi-line, auto-growing so long text is never truncated).
  - Add input.
  - "Booking terms" section: payment milestones and cancellation table.
- **Hide:**
  - Quick-add presets: a "Suggestions" `Popover` per list.
  - Custom milestone/slab inputs: behind "Customise" once terms are loaded.
- **Cut:**
  - "Client Covered" and "Not Included" badges.
  - "0 Milestones • 0 Slabs" counters.
  - Page 4 subtitle.
  - Five repeated "+ Add" buttons.
- **Empty-state rewrite:** One card: "No payment or cancellation terms yet" with **Use standard terms**. Add one line under the button saying what it will add (e.g. the agency's default deposit and cancellation tiers) so nobody worries about overwriting custom terms.
- **Primary action:** `Use standard terms` (while empty), otherwise `none`

---

### 7.8 Screen 8: Editor Tab: Pricing

Salespeople keep full visibility and control of margin. No permission changes.
- **Keep:**
  - Pricing model as a compact `ToggleGroup`: "Package + margin" / "Itemised" / "Total only".
  - Total vs per-person toggle.
  - Net cost input.
  - Markup type and value, live profit, floor indicator.
  - "Include flights in price" checkbox. When ticked, show a **Flight price** input in ₹. **The salesperson enters it manually.** Helper line: "Enter the flight price yourself." If this input does not already exist in the current app, do not invent calculation logic: flag it as a separate task.
  - One summary card: Land package, Flights (when included), Margin, **Client price** (the only emphasised number).
  - Lock line: "Margin never appears on the client PDF."
- **Hide:**
  - "More options": pricing basis, quote validity.
- **Cut:**
  - Section headers "PRICING CALCULATION MODEL", "PRICE DISTRIBUTION" (and "2 Travelers" badge), "GROUND PACKAGE COMMERCIALS". One header: "Cost & margin".
  - Four-colour treatment of the summary card (neutral plus one emphasis only).
  - Orange or green decoration on valid values.
- **Primary action:** `Generate Client PDF`

---

### 7.9 Screen 9: Editor Preview Pane

- **Frozen:** The rendered A4 document inside the pane. Do not touch it.
- **Remove:**
  - The "Print / Save PDF" button. Remove it completely, not into a menu. "Generate Client PDF" in the header is the only way to produce a PDF.
- **Not changed in this pass (needs separate owner approval):**
  - Everything else around the preview stays as it is today: its header label, "Updates on keystroke" line, "Est. A4 Print Pages" estimate, and sizing. Proposed ideas parked for later: zoom / fit-width, page indicator, collapsing on narrow screens, fixing page estimate mismatch.
- **Primary action:** `none` (Generate lives in the header)

---

### 7.10 Screen 10: Modal: New Itinerary

- **Keep:**
  - Three equal choices as shadcn `Tabs`/`ToggleGroup`: Upload quote / Paste text / Start blank.
  - Dropzone with a visible Browse button.
  - Cancel and "Create itinerary".
- **Cut:**
  - The "with AI" marketing subtitle. Replace with: "Upload a supplier quote or paste a message. We'll draft the itinerary for you to review."
  - Red underline tab style (use the same tab style as elsewhere).
- **Fix:**
  - Primary button disabled until a file or text exists.
  - File types: say exactly what works ("PDF or text"). The modal says 50 MB while the architecture doc says 10 MB: make them match.
  - While processing: a progress state, not a frozen button.
  - One reassurance line: "Supplier net rates are never shown to clients."
- **Primary action:** `Create itinerary`

---

### 7.11 Screen 11: Modal: Find Flights

- **Rename:** "Find flights" (not "Search Live Flights & Layovers").
- **Keep:**
  - Origin, destination, date, Search.
  - Route / Flight number as one segmented control.
  - "Add to" as a single `Select`: Auto (default), Going, Return. The engine already infers direction.
- **Cut:**
  - The third direction toggle "Add as New Flight Leg".
  - Popular-airport chips (use autocomplete suggestions instead).
  - Footer boarding-pass note.
- **Copy:** "Find schedules and connections. Prices aren't shown." Accept city names as well as codes (placeholder "City or airport").
- **Primary action:** `Search`

---

### 7.12 Screens 12–13: Modal: Cover Photo Picker (one modal, three tabs)

- **Keep:**
  - Tabs: Suggested / Search stock / Upload.
  - "Suggested" defaults to the trip's destination; other regions in one `Select`.
  - Whole photo card is clickable to choose.
  - Attribution on hover (still printed on the PDF; do not change how it prints).
- **Hide:**
  - Region filter row becomes a dropdown.
  - "Safe zone" appears only inside the cropper.
- **Cut:**
  - "Apply Cover" text link on each card.
  - Aspect-ratio text (appears three times).
  - "A4 Editorial Luxury Spec (1:1.414)" label.
  - "Tip: Press ESC to close."
  - Large empty space in the Upload tab: make the modal height adapt.
- **Fix:** Broken image card (Sheikh Zayed) gets a skeleton and "Couldn't load" fallback, plus a data check. After upload or choosing a photo, go straight to the cropper.
- **Primary action:** `none while browsing; "Use this photo" after choosing`

---

### 7.13 Screen 14: Modal: Cover Cropper

- **Keep:**
  - Crop frame, drag to move, zoom `Slider`, Reset.
  - One "Show guides" toggle (here only).
  - "Use as cover" button.
- **Cut:**
  - Percentage labels and the long zone sentences.
  - Duplicate "Safe zone" toggle.
  - Electric-blue primary (use the global primary).
- **Replace:** Three zones become two light shadings labelled "Logo area" (top) and "Title area" (bottom). Subtitle: "Drag to position. Keep the main subject between the shaded areas." The crop result and how the cover prints are unchanged.
- **Primary action:** `Use as cover`

---

### 7.14 Screen 15: Modal: PDF History (was Version History)

- **Keep:**
  - List of generated PDFs: date/time, who generated it (from auth), Download.
- **Hide:**
  - Hash / audit details: admin-only "Details" expander.
- **Cut:**
  - "immutable", "SHA-256", "cryptographic" wording.
  - Dark modal theme (use the standard white `Dialog`).
- **Empty state:** "No PDFs generated yet" with a **Generate client PDF** button inside the modal.
- **Primary action:** `Generate client PDF` (in the empty state), otherwise `none`
