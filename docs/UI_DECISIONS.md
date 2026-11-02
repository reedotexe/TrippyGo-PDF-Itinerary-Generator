# TrippyGo UI Decisions (Step 3)

> Drafted from `UI_AUDIT.md`, updated with owner answers (2 Nov 2026).
> Every screen gets: **Keep**, **Hide**, **Cut**, **Primary action**.
> Rules: disclosure max two levels. One primary button per screen. Hide only advanced things, never essentials.

---

## FROZEN ZONE: the PDF and its preview must not change at all

**Absolutely zero changes to the client PDF and to the live preview of it.** Not in layout, fonts, colours, spacing, text, page count or page breaks. This redesign covers the application UI only.

Do not edit, restyle, reformat or "clean up":
- `src/templates/itinerary/**` (all print and preview templates)
- `src/app/print/**` (the HMAC print route)
- `services/renderer/**`
- `public/fonts/**` (Cormorant Garamond, Plus Jakarta Sans, Caveat stay exactly as they are)
- Any CSS, Tailwind classes or tokens used by the above
- The rendered A4 document shown inside the editor's preview pane

The PDF and preview keep their own fonts, their ivory/navy/red brand colours and all their current styling.

**Isolation requirements** (the real risk is the new global CSS leaking in):
1. The app's new global CSS (shadcn tokens, Inter, Tailwind preflight, `--radius`, etc.) must **not** be imported by the print route or applied to the preview content. Scope it to the app shell, or render preview/print in a way that is unaffected.
2. The new theme must not override anything the print/preview templates rely on (font families, base font size, line height, border styles, colours).
3. **Gate for every pull request:** the existing visual regression suite (`npm run test:visual`, 8 benchmark PDFs) must show **zero pixel difference**, and `npm run test:leak` must pass. Also screenshot the preview pane before and after and confirm the document inside is identical.
4. If any PDF or preview diff appears, the change is wrong: revert it. Never update the baselines to make the test pass.

Editor-pane chrome *around* the preview is covered in section 9. The document inside it is frozen.

---

## 0. Global decisions (apply to every screen)

**Component system: shadcn/ui, mandatory**
- All application UI is built with shadcn/ui components from `components/ui`. Do not hand-roll buttons, inputs, selects, dialogs, tabs, tables, badges, tooltips, dropdown menus, accordions, toggles or toasts when a shadcn component exists.
- Apply this exact preset in the foundation step (on the `ui-redesign` branch):
  ```bash
  npx shadcn@latest apply --preset bKsFBxgG
  # or
  pnpm dlx shadcn@latest apply --preset bKsFBxgG
  ```
- Its global CSS is the single source of truth for colour and radius (full listing in the appendix). Do not change token values. Every colour in the app comes from these tokens (`bg-background`, `text-foreground`, `bg-primary`, `text-muted-foreground`, `border-border`, etc.). No raw hex, no brand colours in the app.
- After applying the preset, check what it changed (`components.json`, global CSS, any overwritten components). Confirm nothing under the frozen zone changed and the visual regression suite is still clean.
- Light mode only for now. The `.dark` tokens stay in the file but no theme toggle is built.

**Colour**
- Keep it basic and minimal: white surfaces, neutral grays, and the preset's single blue `--primary` for the one primary action per screen.
- Brand colours (navy, heritage red, ivory) are **not** used in the app. They exist only in the PDF and preview.
- `--destructive` for delete and errors only.
- The preset has no warning or success tokens. Add two small extras in the same OKLCH style, used sparingly: amber for warnings (for example the review-flag dot, long-layover notice, low-margin warning) and green for success (for example "PDF ready"). Orange is never used for ordinary values, tabs or inputs.

**Typography**
- **Inter** across the whole application UI, loaded via `next/font`. Two weights (regular 400 and medium/semibold 500-600). A fixed size scale only.
- The PDF and preview keep their existing fonts (no change).

**Buttons: shadcn `Button` variants only**
- `default` (primary): max one per screen.
- `outline` (secondary).
- `ghost` / `icon`.
- `destructive` for delete confirmations only.
- One "add" pattern everywhere: type and press Enter, plus a small ghost "+ Add X" button. No split buttons, no custom pills, no double plus signs.

**Copy rules**
- Labels: 1-3 words. Helper text: one line, only where the field is easy to get wrong.
- Remove jargon from visible UI: "1:1.414", "SHA-256", "immutable", "safe zone 20-65%", "sector/leg". Use "flight", "PDF history", "cover photo".
- Never show a number the app can't back up.

**Consistency**
- All modals use shadcn `Dialog`: same header, same footer (Cancel left, primary right).
- Tabs are shadcn `Tabs` used as navigation, not a wizard. Remove "Step X of 5", keyboard hint lines and numeric prefixes.
- Currency format everywhere in the app UI: `₹1,07,985` (no space, Indian grouping).

**Role-aware (ties to the auth work)**
- Salesperson sees only their own itineraries; dashboard defaults to "Mine".
- Admin-only: Settings, KPI strip, user management, "All itineraries" view.
- Contact fields on the Overview tab prefill from the logged-in user's profile.

---

## 1. Home Dashboard (`/`)

**Keep**
- Search (`⌘K`, shadcn `Command` or `Input`).
- "+ New itinerary".
- shadcn `Table` with columns: Proposal and client, Destinations and dates (e.g. "Phuket, Krabi · 5 Nov · 7N/8D"), Price, Status, Updated.
- Status `Badge` (Draft / PDF ready).
- Filter via `Tabs`/`ToggleGroup`: All / Drafts / PDF ready.
- Row actions: row click opens the editor; PDF icon button.

**Hide**
- Duplicate and Delete go into a row `DropdownMenu` ("…"). Delete is soft.
- Settings goes into a user menu (admin only).
- KPI strip is admin-only, reduced to "PDFs ready" and "Drafts".

**Cut**
- "OPERATIONS" tag and the "B2B Proposal & Itinerary Engine" subtitle.
- "Showing 49 of 49 proposals".
- "TOTAL PROPOSALS" card.
- "TOTAL PIPELINE QUOTED" card: hidden until the ₹0 bug is fixed, then admin-only.
- The text "Edit" button (row click replaces it).
- Separate start-date line.

**Other:** paginate (20 rows per page). "Unpriced Draft" becomes "—". Empty state: one sentence plus the "New itinerary" button.

**Primary action:** + New itinerary

---

## 2. Agency Settings (`/admin/settings`, admin only)

**Keep**
- Default markup type and value.
- Minimum margin floor.
- Selling price rounding.
- Quote validity (days).
- GST display mode.
- Agency GSTIN.
- "Allow salespeople to change markup" `Switch`. Behaviour unchanged: margin permissions are not being modified.
- Back button and Save.

**Hide**
- "Tax compliance (advanced)" `Accordion`: SAC code, TCS 206C switch.

**Cut**
- "GLOBAL POLICY" tag.
- Section subtitles that repeat the section title.
- Orange styling on the margin-floor input (fix as a bug).
- "Governance" wording. Use "Margins", "Tax", "Salespeople".

**Other:** Save is sticky and enabled only when something changed. Label the page "Settings". Agency name/logo fields are out of scope for this pass.

**Primary action:** Save changes

---

## 3. Editor shell, tabs and review banner

**Keep**
- Back, title, trip subtitle, autosave status, undo/redo (small icon buttons).
- Five tabs: Overview, Flights, Days, Inclusions, Pricing.
- Generate Client PDF.
- Review banner (compact).

**Hide**
- "Versions" goes into a "…" menu, renamed "PDF history".
- Keyboard shortcuts go into a tooltip or help menu.

**Cut**
- "Step 1 of 5 • Shortcut Ctrl+1-5" line.
- Numeric prefixes "1." to "5." on tabs.
- Numeric orange count badges on tabs.
- The "Auto-clears" pill.
- "Previous Step" button.

**Replace**
- Tab badges become a single small amber dot when a tab contains unreviewed extracted fields.
- Review banner becomes: "7 fields to review" (shadcn `Alert`) with a **Review next** button that jumps through gold-bordered fields. It dismisses itself at zero. Do not change the gold-border behaviour of the fields themselves.
- Bottom bar keeps only "Next: Flights →" as an `outline`/`ghost` button.

**Primary action:** Generate Client PDF

---

## 4. Editor Tab: Overview

Group into three labelled sections, top to bottom.

**Keep**
- *Trip:* package title, guest name, destinations (chips plus input).
- *Dates & travellers:* nights, days, start date, end date (read-only text), adults, children, infants, rooms.
- *Cover photo:* thumbnail plus "Change cover".

**Hide**
- "Your contact details" (specialist name, phone, email): collapsed, prefilled from the user profile.

**Cut**
- "A4 Portrait (1:1.414)" badge.
- "Auto-syncs Days/Nights" and "Based on Start + Nights" subtitles. Replace with one tooltip: "Days and nights stay in sync."
- Preset quick-pick pills on this tab (they live in the cover picker).
- Fallback warning wording. Replace with: "Using a photo from Day 1. Choose a cover for a stronger first page."
- The "+ Add" button for destinations becomes a small ghost "Add".

**Primary action:** none (Next →)

---

## 5. Editor Tab: Flights

**Keep**
- Two groups: Going and Return.
- Compact flight rows: airline, date, DEP→ARR with times, duration/stops, baggage.
- One "+ Add flight" control with a small menu: Find flights / Add manually / Auto-suggest.
- Layover notices between flights (derived automatically).

**Hide**
- Clear all, reorder, delete, and "Add layover note" go into each row's "…" menu (reorder also by drag).
- Row edit fields expand inline when the row is clicked; make this obvious with a chevron.

**Cut**
- Route breadcrumb "DEL → DEL (4 Stops via KUL, HKT, KUL, KUL)".
- "5 Flight Sectors" badge and the Page 3 subtitle.
- Three different add buttons and "+ + Layover".
- The words "sector" and "leg" everywhere: use "flight".

**Other:** an empty or incomplete extracted flight (e.g. "Airline: Airline", 00:00) gets the review state, not silence. Layover severity: under 6h neutral, 6-12h amber, overnight/over 12h strong amber with "Check stay". Do not change how flights render in the PDF.

**Primary action:** + Add flight

---

## 6. Editor Tab: Days

**Keep**
- Left: vertical list of all days ("Day 1 · Coco Island"), each with a status dot (hotel / photo missing). Right: editor for the selected day. On narrow screens, an `Accordion`.
- Fields: day title, narrative, hotel, city, room type.
- Meals: three `Toggle`s with an unmistakable on/off state (check icon when on). No trailing "+".
- Activities: chips plus input.

**Hide**
- Day photo: collapsed "Photo (optional)" with "Choose photo".
- Quick-add activity pills: collapsed under "Suggestions".
- Duplicate / delete / collapse day: "…" menu.

**Cut**
- "8 Days Total" badge and panel subtitle.
- Per-day "Changes autosave instantly" note.
- The `#01 EDITING DAY 1 OF 8` banner (the selected list item already shows it).
- Large empty "No Photo Selected" box. Photo is explicitly optional.

**Primary action:** + Add day

---

## 7. Editor Tab: Inclusions

**Keep**
- Two columns: Included, Excluded.
- Editable rows (multi-line, auto-growing so long text is never truncated).
- Add input.
- "Booking terms" section: payment milestones and cancellation table.

**Hide**
- Quick-add presets: a "Suggestions" `Popover` per list.
- Custom milestone/slab inputs: behind "Customise" once terms are loaded.

**Cut**
- "Client Covered" and "Not Included" badges.
- "0 Milestones • 0 Slabs" counters.
- Page 4 subtitle.
- Five repeated "+ Add" buttons.

**Empty-state rewrite:** one card: "No payment or cancellation terms yet" with **Use standard terms**. Add one line under the button saying what it will add (e.g. the agency's default deposit and cancellation tiers) so nobody worries about overwriting custom terms.

**Primary action:** Use standard terms (while empty), otherwise none

---

## 8. Editor Tab: Pricing

Salespeople keep full visibility and control of margin. No permission changes.

**Keep**
- Pricing model as a compact `ToggleGroup`: "Package + margin" / "Itemised" / "Total only".
- Total vs per-person toggle.
- Net cost input.
- Markup type and value, live profit, floor indicator.
- "Include flights in price" checkbox. When ticked, show a **Flight price** input in ₹. **The salesperson enters it manually.** Helper line: "Enter the flight price yourself." If this input does not already exist in the current app, do not invent calculation logic: flag it as a separate task.
- One summary card: Land package, Flights (when included), Margin, **Client price** (the only emphasised number).
- Lock line: "Margin never appears on the client PDF."

**Hide**
- "More options": pricing basis, quote validity.

**Cut**
- Section headers "PRICING CALCULATION MODEL", "PRICE DISTRIBUTION" (and "2 Travelers" badge), "GROUND PACKAGE COMMERCIALS". One header: "Cost & margin".
- Four-colour treatment of the summary card (neutral plus one emphasis only).
- Orange or green decoration on valid values.

**Primary action:** Generate Client PDF

---

## 9. Editor preview pane

**Frozen:** the rendered A4 document inside the pane. Do not touch it.

**Remove**
- The "Print / Save PDF" button. Remove it completely, not into a menu. "Generate Client PDF" in the header is the only way to produce a PDF.

**Not changed in this pass (needs separate owner approval)**
Everything else around the preview stays as it is today: its header label, "Updates on keystroke" line, "Est. A4 Print Pages" estimate, and sizing. Proposed ideas parked for later, not for implementation now: zoom / fit-width and page indicator, collapsing the pane on narrow screens, fixing or hiding the page estimate (audit found "~3-4" vs 14 pages).

**Primary action:** none (Generate lives in the header)

---

## 10. Modal: New Itinerary

**Keep**
- Three equal choices as shadcn `Tabs`/`ToggleGroup`: Upload quote / Paste text / Start blank.
- Dropzone with a visible Browse button.
- Cancel and "Create itinerary".

**Cut**
- The "with AI" marketing subtitle. Replace with: "Upload a supplier quote or paste a message. We'll draft the itinerary for you to review."
- Red underline tab style (use the same tab style as elsewhere).

**Fix**
- Primary button disabled until a file or text exists.
- File types: say exactly what works ("PDF or text"). The modal says 50 MB while the architecture doc says 10 MB: make them match.
- While processing: a progress state, not a frozen button.
- One reassurance line: "Supplier net rates are never shown to clients."

**Primary action:** Create itinerary

---

## 11. Modal: Find Flights

**Rename:** "Find flights" (not "Search Live Flights & Layovers").

**Keep**
- Origin, destination, date, Search.
- Route / Flight number as one segmented control.
- "Add to" as a single `Select`: Auto (default), Going, Return. The engine already infers direction.

**Cut**
- The third direction toggle "Add as New Flight Leg".
- Popular-airport chips (use autocomplete suggestions instead).
- Footer boarding-pass note.

**Copy:** "Find schedules and connections. Prices aren't shown." Accept city names as well as codes (placeholder "City or airport").

**Primary action:** Search

---

## 12-13. Modal: Cover Photo Picker (one modal, three tabs)

**Keep**
- Tabs: Suggested / Search stock / Upload.
- "Suggested" defaults to the trip's destination; other regions in one `Select`.
- Whole photo card is clickable to choose.
- Attribution on hover (still printed on the PDF; do not change how it prints).

**Hide**
- Region filter row becomes a dropdown.
- "Safe zone" appears only inside the cropper.

**Cut**
- "Apply Cover" text link on each card.
- Aspect-ratio text (appears three times).
- "A4 Editorial Luxury Spec (1:1.414)" label.
- "Tip: Press ESC to close."
- Large empty space in the Upload tab: make the modal height adapt.

**Fix:** broken image card (Sheikh Zayed) gets a skeleton and "Couldn't load" fallback, plus a data check. After upload or choosing a photo, go straight to the cropper.

**Primary action:** none while browsing; "Use this photo" after choosing

---

## 14. Modal: Cover Cropper

**Keep**
- Crop frame, drag to move, zoom `Slider`, Reset.
- One "Show guides" toggle (here only).
- "Use as cover" button.

**Cut**
- Percentage labels and the long zone sentences.
- Duplicate "Safe zone" toggle.
- Electric-blue primary (use the global primary).

**Replace:** three zones become two light shadings labelled "Logo area" (top) and "Title area" (bottom). Subtitle: "Drag to position. Keep the main subject between the shaded areas." The crop result and how the cover prints are unchanged.

**Primary action:** Use as cover

---

## 15. Modal: PDF History (was Version History)

**Keep**
- List of generated PDFs: date/time, who generated it (from auth), Download.

**Hide**
- Hash / audit details: admin-only "Details" expander.

**Cut**
- "immutable", "SHA-256", "cryptographic" wording.
- Dark modal theme (use the standard white `Dialog`).

**Empty state:** "No PDFs generated yet" with a **Generate client PDF** button inside the modal.

**Primary action:** Generate client PDF (in the empty state), otherwise none

---

## Bugs found by the audit (fix as bugs, not design)

1. Dashboard "Total pipeline quoted" shows ₹0 with 49 proposals.
2. Incomplete extracted flights (e.g. flight #3: "Airline", 00:00) are not flagged for review.
3. Editor preview "Est. A4 Print Pages ~3-4" vs actual 14 pages (parked: it sits next to the frozen preview).
4. Broken image card in the cover picker (Sheikh Zayed).
5. "+ + Layover" label typo.
6. Margin-floor value styled orange when it isn't a warning.
7. Upload limit mismatch: 50 MB in UI vs 10 MB in architecture doc; "PDF / Doc" tab label vs "PDF or TXT" support.
8. Tab badge counts don't match content (Flights badge 4, with 5 flights).
9. Currency and percent formatting inconsistent in the app UI (`15.0%` vs `15%`).
10. Duplicate and placeholder titles in the proposal list (e.g. "Original V1 Package Title") are test data: clean the seed data.

---

## Appendix: design tokens from the shadcn preset (`bKsFBxgG`)

Source of truth. Do not modify values. Light mode in use; `.dark` kept but unused for now.

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
