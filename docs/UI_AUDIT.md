# UI Audit & Critique: TrippyGo B2B Itinerary Generator

> **Evaluation Methodology:** Conducted under the `/impeccable critique` and `/impeccable audit` frameworks (Nielsen Norman heuristics, Cognitive Load Theory, visual hierarchy, operate-mode scanability, token discipline, and accessibility).
>
> **Target Persona:** Travel sales professional / travel consultant creating custom luxury holiday proposals under time pressure.
>
> **Scope:** All non-PDF routes, panels, and modals across the application. (PDF print pages `/print/[id]` are excluded per instruction).
>
> **Strict Directive:** Pure diagnostic observation and inventory only. No fixes are proposed, and no code changes are made.

---

## Table of Contents

1. [Screen 1: Home Dashboard (`/`)](#screen-1-home-dashboard-)
2. [Screen 2: Agency Settings (`/admin/settings`)](#screen-2-agency-settings-adminsettings)
3. [Screen 3: Editor — Global Shell, Tab Bar & Review Flags Banner](#screen-3-editor--global-shell-tab-bar--review-flags-banner)
4. [Screen 4: Editor — Tab 1: Overview & Logistics](#screen-4-editor--tab-1-overview--logistics)
5. [Screen 5: Editor — Tab 2: Travel Flights & Boarding Passes](#screen-5-editor--tab-2-travel-flights--boarding-passes)
6. [Screen 6: Editor — Tab 3: Day-by-Day Journey Plan](#screen-6-editor--tab-3-day-by-day-journey-plan)
7. [Screen 7: Editor — Tab 4: Inclusions, Exclusions & Booking Policies](#screen-7-editor--tab-4-inclusions-exclusions--booking-policies)
8. [Screen 8: Editor — Tab 5: Pricing, Commercials & Margins](#screen-8-editor--tab-5-pricing-commercials--margins)
9. [Screen 9: Editor — Live Client HTML/PDF Preview Pane](#screen-9-editor--live-client-htmlpdf-preview-pane)
10. [Screen 10: Modal — New Itinerary Intake](#screen-10-modal--new-itinerary-intake)
11. [Screen 11: Modal — Live Flight Search & Layovers](#screen-11-modal--live-flight-search--layovers)
12. [Screen 12: Modal — Cover Photo Picker (Curated Presets & Stock Search)](#screen-12-modal--cover-photo-picker-curated-presets--stock-search)
13. [Screen 13: Modal — Cover Photo Picker (Custom Upload Dropzone)](#screen-13-modal--cover-photo-picker-custom-upload-dropzone)
14. [Screen 14: Modal — Interactive A4 Portrait Cropper](#screen-14-modal--interactive-a4-portrait-cropper)
15. [Screen 15: Modal — Version History & Audit Trail](#screen-15-modal--version-history--audit-trail)

---

## Screen 1: Home Dashboard (`/`)

### 1. Element Inventory & Salesperson Frequency

| Element | Classification | Rationale |
| :--- | :--- | :--- |
| **TrippyGo Brand Icon & Name** | Rarely | Static brand anchor; has no functional value during active workflow. |
| **"OPERATIONS" / "B2B Proposal & Itinerary Engine" Tag** | Rarely | Static system metadata; irrelevant to daily proposal drafting. |
| **Global Search Input (`⌘K`)** | Sometimes | Used when searching through an accumulated backlog of past proposals. |
| **"Settings" Button** | Rarely | One-time administrative configuration; rarely accessed by salespeople. |
| **"+ New Itinerary" Primary Button** | Always | Primary entry point to initiate every new client proposal workflow. |
| **"TOTAL PROPOSALS" KPI Stat Card (49)** | Rarely | Aggregate organizational metric; does not impact individual proposal creation. |
| **"PDFS READY" KPI Stat Card (17 Active)** | Sometimes | High-level status overview of finalised, sendable proposals. |
| **"IN DRAFT" KPI Stat Card (32)** | Sometimes | Reminder of pending unfinalized itineraries. |
| **"TOTAL PIPELINE QUOTED" KPI Stat Card (₹0)** | Rarely | High-level financial reporting metric (currently displaying ₹0). |
| **Filter Tabs ("All (49)", "PDF Ready (17)", "Drafts (32)")** | Sometimes | Useful for filtering down the proposal inventory by readiness state. |
| **Table Header Row (Proposal & Client, Destinations, Price, Status, Updated, Actions)** | Always | Orientation labels for the 49-row data grid. |
| **Package Title Link/Text** | Always | Primary identifier for locating and selecting a proposal. |
| **Client Name / "Unassigned Client" Label** | Always | Identifies customer recipient; critical for quoting the right party. |
| **Destinations List & Duration (`5N / 6D`)** | Sometimes | Validates destination alignment without entering the editor. |
| **Start Date (`Starts 5 Nov 2026`)** | Sometimes | Verifies seasonality and lead time. |
| **Selling Price Column ("Unpriced Draft" text)** | Sometimes | Informs whether commercial quoting has taken place. |
| **Status Badge (`PDF Ready` green / `Draft` orange)** | Always | Indicates immediate readiness to send vs work in progress. |
| **Updated Timestamp (`1h ago`, `6d ago`, `24 Oct`)** | Sometimes | Helps locate recently modified proposals. |
| **"Edit" Action Button (Pencil icon + text)** | Always | Primary action to resume drafting the itinerary. |
| **PDF View/Download Icon Button** | Always | Primary action to preview or download the generated client document. |
| **Duplicate / Copy Icon Button** | Sometimes | Used when duplicating a proven package template for a new lead. |
| **Delete / Trash Icon Button** | Rarely | Destructive action; infrequent in standard sales operations. |

### 2. Extended Text Blocks
* **Top Subtitle:** `"B2B Proposal & Itinerary Engine"`
* **Main Heading Subtext:** `"Showing 49 of 49 proposals"`
* **Table Row Subtitle (Fallback state):** `"Unassigned Client"`
* **Selling Price (Fallback state):** `"Unpriced Draft"`

### 3. Inconsistencies (Buttons, Spacing, Fonts, Colours)
* **Button Style Divergence:** The top navbar pairs an outlined, pill-shaped ghost button (`Settings`) with a solid vibrant red button (`+ New Itinerary`). Inside the table rows, the primary edit trigger switches to a small grey outlined button (`Edit`), while secondary actions are naked icon buttons without text labels.
* **Colour Semantics:** The KPI card for "PDFS READY" renders `17 Active` in bright emerald green, while the "TOTAL PIPELINE QUOTED" displays `₹0` in monochrome charcoal without contextual zero-state styling. In the table, `Draft` uses an amber/orange badge, whereas `Unpriced Draft` in the adjacent column is plain light grey text.
* **Typography Scale:** The top stats strip uses small, tracked-out uppercase micro-labels (`TOTAL PROPOSALS`, `PDFS READY`, `IN DRAFT`), but the proposal count numbers are rendered in bold modern sans-serif, clashing with the editorial typography ethos defined in brand guidelines.
* **Row Density & Visual Padding:** Table rows contain three lines of stacked metadata under "PROPOSAL & CLIENT" and "DESTINATIONS & DURATION", making vertical spacing tight and leading to claustrophobic touch/click targets on 13-inch displays.

### 4. Top 3 Intimidation Factors for a First-Time User
1. **Dense 49-Row Unpaginated Wall:** The screen loads immediately into a massive, unbounded vertical list of 49 items with duplicate or placeholder titles (`Srinagar - Gulmarg - Pahalgam - Sonamarg` repeated 10+ times, `Original V1 Package Title`), creating visual disorientation and fear of making duplicate edits.
2. **Ambiguous Status & Missing Prices:** Almost every proposal displays `"Unpriced Draft"` alongside an orange `"Draft"` pill badge, leaving the user uncertain whether any proposal has valid commercial data or if the application is broken.
3. **Broken Pipeline Value Indicator:** The prominent `"TOTAL PIPELINE QUOTED"` header stat displays `₹0` despite 49 existing proposals, immediately undermining trust in the system's financial integrity.

---

## Screen 2: Agency Settings (`/admin/settings`)

### 1. Element Inventory & Salesperson Frequency

| Element | Classification | Rationale |
| :--- | :--- | :--- |
| **Back Button (Arrow in rounded box)** | Always | Vital for returning to the main dashboard after checking rules. |
| **Page Heading ("Agency Settings") & "GLOBAL POLICY" Tag** | Rarely | Static administrative context. |
| **Subtitle Explanation** | Rarely | High-level descriptive text. |
| **"Save Changes" Primary Action Button (Red)** | Sometimes | Admin action; salespeople should not frequently commit global policy changes. |
| **Section 1: "Commercials & Margin Governance" Card Header & Icon** | Rarely | Category banner. |
| **Default Markup Type Dropdown (`Percentage (%)`)** | Rarely | Baseline configuration established once by agency leadership. |
| **Default Markup Value Input (`15`)** | Rarely | Agency-wide default; not tuned per salesperson proposal. |
| **Minimum Margin Floor Input (`8`)** | Sometimes | Relevant for knowing margin limits, but rarely modified directly. |
| **Selling Price Rounding Rule Dropdown** | Rarely | Backend commercial formula setting. |
| **Quote Validity Duration Input (`7` days)** | Sometimes | Governs the proposal disclaimer validity window. |
| **Section 2: "GST, SAC & TCS Tax Compliance" Card Header & Icon** | Rarely | Accounting/statutory compliance block. |
| **GST Display Mode Dropdown (`Inclusive (Standard Tour Package 5%)`)** | Rarely | Governs tax breakdown rendering on invoices/quotes. |
| **SAC Code Input (`998552`)** | Rarely | Indian taxation service classification code; purely statutory. |
| **Agency GSTIN Input (`27AABCT1234D1Z5`)** | Rarely | Static legal tax registration identifier. |
| **TCS Disclosure under Section 206C Toggle Switch** | Rarely | Indian tax collected at source statutory switch. |
| **Section 3: "Sales Governance & Permissions" Card Header & Icon** | Rarely | Managerial permissions card. |
| **"Allow Salesperson Markup Overrides" Toggle Switch** | Rarely | High-level governance toggle set by management. |

### 2. Extended Text Blocks
* **Page Subtitle:** `"Markup rules, GSTIN, tax modes, and compliance defaults"`
* **Section 1 Subtitle:** `"Configure default markup parameters, minimum margin floor, and rounding precision"`
* **Default Markup Type Helper Text:** `"Applied automatically to newly imported quotes."`
* **Default Markup Value Helper Text:** `"Standard baseline markup for tours."`
* **Minimum Margin Floor Helper Text:** `"Triggers low-margin warning if sales markup falls below this threshold."`
* **Selling Price Rounding Rule Helper Text:** `"Applied once at final client price calculation to eliminate odd paise endings."`
* **Quote Validity Duration Helper Text:** `"Default validity disclaimer printed in client proposal footer."`
* **Section 2 Subtitle:** `"Statutory credentials printed on client proposals and tax breakdown mode"`
* **GST Display Mode Helper Text:** `"Determines how tax is displayed on the pricing schedule."`
* **SAC Code Helper Text:** `"998552: Tour Operator Services without ITC."`
* **Agency GSTIN Helper Text:** `"Included on formal payment and remittance schedule."`
* **TCS Disclosure Helper Text:** `"When enabled, prints statutory disclaimer: “TCS @ applicable rates under Sec 206C to be collected separately”."`
* **Section 3 Subtitle:** `"Controls permissions and limits for sales representatives"`
* **Allow Salesperson Markup Overrides Helper Text:** `"Allows sales reps to customize markup per proposal. Safety floor warning will still trigger if below minimum margin."`

### 3. Inconsistencies (Buttons, Spacing, Fonts, Colours)
* **Orange Number Anomaly:** The `Minimum Margin Floor (%)` input value (`8`) is styled in bold, warning-level orange text, whereas all other numeric inputs (`15`, `7`, `998552`) use dark slate. This creates a false impression of an active validation error or policy violation on an unmodified setting.
* **Toggle Style Variations:** The "Allow Salesperson Markup Overrides" toggle uses a dark navy fill when active, while the "TCS Disclosure" toggle in the section above uses an unselected neutral grey state, lacking consistent hover cues or switch transitions.
* **Heading Hierarchy vs Section Semantics:** The page title is "Agency Settings", but none of the settings configure basic agency attributes (agency name, brand logo, telephone, address, social media handles). It strictly controls financial governance, tax parameters, and markup policies.

### 4. Top 3 Intimidation Factors for a First-Time User
1. **Statutory Tax Jargon Overload:** Elements such as `"SAC Code 998552"`, `"Tour Operator Services without ITC"`, and `"TCS Disclosure under Section 206C"` confront the user with formal Indian tax compliance concepts rather than sales-enabling tools.
2. **Warning Tone on Standard Inputs:** The bright orange font in the "Minimum Margin Floor" box creates apprehension that a critical threshold has been broken before any editing has occurred.
3. **High-Risk Governance Anxiety:** Presenting switches labeled `"Allow Salesperson Markup Overrides"` and `"Commercials & Margin Governance"` makes a salesperson worry that saving changes will inadvertently overwrite corporate financial policies for all agents.

---

## Screen 3: Editor — Global Shell, Tab Bar & Review Flags Banner

### 1. Element Inventory & Salesperson Frequency

| Element | Classification | Rationale |
| :--- | :--- | :--- |
| **Back Arrow Button (`←`)** | Always | Essential for safely exiting back to proposal list. |
| **"TRIPPYGO" Red Logo Badge** | Rarely | Static brand element. |
| **Itinerary Title Headline ("Phuket, Krabi & Kuala Lumpur Getaway")** | Always | Verifies which client document is currently open. |
| **Trip Subtitle (`7N / 8D • Phuket, Krabi...`)** | Sometimes | Quick verification of itinerary scope. |
| **Autosave Status Indicator (`● All changes saved`)** | Always | Provides reassurance that edits are preserved. |
| **Undo / Redo History Buttons** | Sometimes | Reversing accidental input changes. |
| **"Versions" History Button** | Sometimes | Accessing past generated PDF iterations and audit history. |
| **"Generate Client PDF" Primary Button (Solid Red)** | Always | Final action of the entire workflow; renders the client-facing PDF. |
| **Tab 1: "1. Overview" (with badge "1")** | Always | Step 1 navigation trigger. |
| **Tab 2: "2. Flights" (with badge "4")** | Always | Step 2 navigation trigger. |
| **Tab 3: "3. Day Plan"** | Always | Step 3 navigation trigger. |
| **Tab 4: "4. Inclusions"** | Always | Step 4 navigation trigger. |
| **Tab 5: "5. Pricing" (with badge "1")** | Always | Step 5 navigation trigger. |
| **Step Counter (`Step 1 of 5 • Shortcut Ctrl+1 - 5`)** | Sometimes | Informs the user of keyboard shortcuts and overall progress. |
| **Review Flags Warning Banner (Yellow Bar)** | Always | Critical alert signaling unverified AI-extracted fields. |
| **Warning Banner Subtext** | Always | Explains what the gold borders mean and how to dismiss them. |
| **"Auto-clears" Gold Badge/Button** | Rarely | Passive status indicator styled confusingly like an actionable button. |

### 2. Extended Text Blocks
* **Review Flags Banner Text:** `"Review Flags: Found 7 extracted field(s) needing salesperson verification. Fields are highlighted with gold borders and auto-clear as you edit."`
* **Step Progression Tracker:** `"Step 1 of 5 • Shortcut Ctrl+1 - 5"`

### 3. Inconsistencies (Buttons, Spacing, Fonts, Colours)
* **Numeric Alert Badges on Tabs:** Tabs 1, 2, and 5 show bright orange circles with numbers (`1`, `4`, `1`), but Tabs 3 and 4 have no badges. There is no tooltip or legend clarifying whether these represent unread notifications, extraction warnings, validation errors, or item counts (e.g., Tab 2 has 5 flights, but its badge says `4`).
* **Active Tab Contrast:** When a tab is selected, it turns into a dark navy solid pill with white text. Inactive tabs use faint slate text with light grey borders. However, the badge inside the active tab remains bright orange, creating conflicting visual urgency on an already selected view.
* **Banner Button-or-Label Confusion:** The `"Auto-clears"` pill on the far right of the Review Flags banner has rounded corners and a border matching action buttons, but it is purely informative and non-clickable.

### 4. Top 3 Intimidation Factors for a First-Time User
1. **Urgent Orange Alert Badges on First Load:** Seeing orange warning circles scattered across navigation tabs before doing any work makes a user feel that their proposal is broken or failing compliance.
2. **Ambiguous Review Flags Warning:** The yellow banner states `"Found 7 extracted field(s) needing salesperson verification"`, but does not list which fields they are or provide a button to jump directly to them, forcing the salesperson to hunt through all tabs.
3. **Cognitive Pressure of Compulsory Multi-Step Wizards:** The `"Step 1 of 5"` framing combined with shortcut hints (`Ctrl+1 - 5`) suggests a strict, rigid sequential workflow rather than a flexible workspace where a salesperson can jump directly to what the client requested.

---

## Screen 4: Editor — Tab 1: Overview & Logistics

### 1. Element Inventory & Salesperson Frequency

| Element | Classification | Rationale |
| :--- | :--- | :--- |
| **Section Title: "Trip Overview & Logistics" (Clipboard Icon)** | Rarely | Orientation title. |
| **PACKAGE TITLE * Input Field** | Always | The headline that prints on the PDF cover page. |
| **GUEST / CLIENT NAME (optional) Input Field** | Always | Customises proposal for the lead (`Mr. & Mrs. Sharma`). |
| **DESTINATIONS CIRCUIT * Tag Cloud Container** | Always | Determines the itinerary route and PDF front-cover circuit text. |
| **Individual Destination Tags (`Phuket ×`, `Krabi ×`, etc.)** | Always | Verifying and pruning destinations. |
| **Add Destination Input ("Add destination... and press Enter")** | Sometimes | Adding missing tour halts. |
| **"+ Add" Solid Navy Button** | Sometimes | Explicit click target for keyboard-averse users. |
| **COVER PHOTO PRESENTATION Container** | Always | Curates the main visual impression of the luxury proposal. |
| **Cover Photo Thumbnail with "A4" Badge** | Always | Immediate preview of Page 1 imagery. |
| **Ratio Badge (`A4 Portrait (1:1.414)`)** | Rarely | Technical aspect ratio specification; meaningless to sales reps. |
| **Fallback Warning Subtext** | Sometimes | Warns if the cover is defaulting to a day photo. |
| **"Choose Cover Photo" Button (Navy + Sparkle Icon)** | Always | Opens the photo selection modal. |
| **Presets Quick-Pick Pills (`Phi Phi Island...`, `Taj Mahal...`)** | Sometimes | One-click cover replacement with regional hero shots. |
| **Duration: Nights Input** | Always | Controls total tour duration calculation. |
| **Duration: Days Input** | Always | Controls day-by-day plan structure. |
| **"Auto-syncs Days" / "Auto-syncs Nights" Subtitles** | Rarely | Explanatory formula helper notes. |
| **Trip Start Date Picker** | Always | Departure date anchor. |
| **Trip End Date (Computed) Disabled Input** | Sometimes | Visual validation of tour conclusion date. |
| **Adults (12+ yrs) Input** | Always | Direct impact on rooming, airline seating, and quoting. |
| **Children (2–11 yrs) Input** | Sometimes | Impact on family packages and child-with-bed pricing. |
| **Infants (0–2 yrs) Input** | Sometimes | Impact on airline lap tickets and hotel cot requirements. |
| **Rooms Required Input** | Always | Essential for hotel booking calculations. |
| **Trip Specialist Name Input** | Sometimes | Often prepopulated from user session; edited if delegating. |
| **Direct Phone / WhatsApp Input** | Sometimes | Contact printed on proposal back cover. |
| **Official Email Input** | Sometimes | Direct sales inquiry channel printed on proposal. |
| **Bottom Stepper Bar ("Previous Step" disabled, "Next: Flights >")** | Always | Navigation forward to the next editing module. |

### 2. Extended Text Blocks
* **Cover Presentation Helper Text:** `"Currently using automatic fallback from Day 1. Select a curated portrait hero for optimal Page 1 impact."`
* **Destination Input Placeholder:** `"Add destination (e.g. Gulmarg) and press Enter"`
* **Client Name Placeholder:** `"e.g. Mr. & Mrs. Sharma (or Valued Traveller)"`
* **Trip Specialist Name Placeholder:** `"e.g. Rahul Sharma"`
* **Direct Phone Placeholder:** `"e.g. +91 98765 12345"`
* **Official Email Placeholder:** `"e.g. rahul@trippygo.com"`
* **Date Helper Subtitles:** `"Departure anchor"` and `"Based on Start + Nights"`

### 3. Inconsistencies (Buttons, Spacing, Fonts, Colours)
* **Button Style Conflicts:** In the destination section, `+ Add` is a sharp dark navy button. In the cover section, `Choose Cover Photo` is also navy with a gold sparkle icon. In the duration section, buttons disappear in favor of native date pickers. At the bottom, `Next: Flights >` is another large solid navy button, while `Previous Step` is an outlined grey button.
* **Aspect Ratio Technicality:** The badge `A4 Portrait (1:1.414)` introduces an aspect ratio notation that is mathematically precise but confusing to a non-designer sales representative.
* **Four-Column Alignment Discrepancy:** The "DURATION & TRAVEL DATES" row has 4 columns (Nights, Days, Start Date, End Date). Immediately below, "TRAVELLERS & ACCOMMODATION" also has 4 columns (Adults, Children, Infants, Rooms Required). However, the column widths do not visually align because of varying label lengths, resulting in uneven vertical margins.

### 4. Top 3 Intimidation Factors for a First-Time User
1. **Fear of Breaking Auto-Sync Logic:** Subtext notes reading `"Auto-syncs Days"` and `"Based on Start + Nights"` make users nervous that typing a manual day count will corrupt or overwrite their entered dates.
2. **Dense Form Stacking:** Packing 14 distinct input boxes, 2 tag inputs, a photo cropper card, and 3 contact fields onto a single scrollable pane creates fatigue and feels like filling out an administrative government visa form.
3. **Ambiguity Around Cover Image Cropping:** Seeing a card that says `"Currently using automatic fallback from Day 1"` accompanied by a tiny portrait thumbnail leaves the salesperson wondering if their PDF cover will look pixelated or badly cropped if left untouched.

---

## Screen 5: Editor — Tab 2: Travel Flights & Boarding Passes

### 1. Element Inventory & Salesperson Frequency

| Element | Classification | Rationale |
| :--- | :--- | :--- |
| **Panel Title ("Travel Flights & Boarding Passes")** | Rarely | Orientation title. |
| **"5 Flight Sectors" Counter Badge** | Sometimes | Verifies sector quantity against supplier quotes. |
| **Panel Subtitle Explanation** | Rarely | Informational note regarding Page 3 PDF rendering. |
| **"+ Add Flight" Split Dropdown Button** | Always | Main trigger to add new sectors or open live flight search. |
| **"✨ Auto-Suggest" Action Button** | Sometimes | Automatically matches flight sectors to trip dates and cities. |
| **Clear All / Trash Can Button** | Rarely | Dangerous action; empties all configured flights. |
| **"ONWARD JOURNEY (GOING FLIGHTS)" Section Badge** | Always | Visual divider for outbound international/domestic flights. |
| **"+ Add Sector" Outbound Action Button** | Always | Adds an outbound sector. |
| **Empty State Outbound Box & "+ Add first outbound leg" Link** | Sometimes | Visible when no outbound flights exist. |
| **"RETURN JOURNEY (RETURNING FLIGHTS)" Section Badge** | Always | Visual divider for return/inbound flights. |
| **Route Breadcrumb (`• DEL → DEL (4 Stops via KUL, HKT...)`)** | Sometimes | Validates complex multi-stop routing. |
| **"+ Add Sector" Inbound Action Button** | Always | Adds an inbound return sector. |
| **Flight Card Index Badge (`#1`, `#2`, etc.)** | Always | Identifies leg sequence. |
| **Airline Name Input / Display (`Malaysia Airlines`)** | Always | Carrier name printed on boarding pass. |
| **Travel Date Input (`2026-02-11`)** | Always | Flight date printed on boarding pass. |
| **Departure Time (`23:10`) & Airport Code (`DEL`)** | Always | Boarding and takeoff timings. |
| **Flight Duration & Stop Type (`7H 55M / NON-STOP`)** | Sometimes | Communicates flight comfort to client. |
| **Arrival Time (`07:05`) & Destination Code (`KUL`)** | Always | Arrival schedule. |
| **Baggage Allowance Badge (`🧳 15 kg`)** | Always | Critical client check (preventing airport check-in disputes). |
| **"Edit" Button (Pencil Icon)** | Always | Expands flight card for detailed time/airline modifications. |
| **"+ + Layover" Action Button (Amber Outline)** | Sometimes | Inserts an explicit connecting layover note between legs. |
| **Card Reorder Chevrons (Up / Down)** | Sometimes | Fixes leg order if imported chronologically backwards. |
| **Delete Card Trash Button** | Sometimes | Removes an extra or unwanted flight leg. |
| **Layover Amber Alert Banners** | Always | Displays transit duration and baggage handling warnings. |
| **Bottom Stepper Bar ("Previous Step", "Next: Day Plan >")** | Always | Workflow step navigation. |

### 2. Extended Text Blocks
* **Panel Subtitle:** `"Configured flights render as authentic boarding passes on Page 3 of the client proposal."`
* **Outbound Empty State:** `"No outbound flight legs added yet. + Add first outbound leg"`
* **Route Summary Breadcrumb:** `"• DEL → DEL (4 Stops via KUL, HKT, KUL, KUL)"`
* **Layover Warning 1:** `"2h 5m layover in Kuala Lumpur (KUL) • Baggage checked through to final destination"`
* **Layover Warning 2:** `"Transit layover in Phuket (HKT) • Baggage checked through to final destination"`
* **Critical Layover Warning 3:** `"Overnight (45h 55m) layover in Kuala Lumpur (KUL) • Overnight transit connection • Please verify transit accommodation"`

### 3. Inconsistencies (Buttons, Spacing, Fonts, Colours)
* **Triple "+ Add" Variants:** The panel has three distinct button designs performing variations of the same action: a large split solid navy button (`+ Add Flight`), a light blue/indigo pill button (`+ Add Sector`), and a raw text link (`+ Add first outbound leg`).
* **Layover Button Typography:** The button label reads `+ + Layover` with a double plus sign, which appears like a typo or concatenation error. It is styled with an orange outline, conflicting with standard blue/navy buttons.
* **Severe Layover Warning Styling:** An alarming 46-hour layover is styled with the exact same light yellow background as a routine 2-hour layover, failing to visually escalate an extreme travel schedule risk.
* **Flight #3 Incomplete Extraction State:** Flight card #3 shows `"Airline: Airline"`, `"Date flexible"`, `"00:00 HKT -> 0H NON-STOP -> KUL 00:00"`. It has no highlighted warning border despite being completely empty and unverified.

### 4. Top 3 Intimidation Factors for a First-Time User
1. **Raw Aviation Routing Complexity:** Showing a compressed string like `"DEL → DEL (4 Stops via KUL, HKT, KUL, KUL)"` alongside 5 disconnected flight cards induces panic over whether the return flight loops backwards.
2. **Double Action Confusion (Flight vs Sector vs Leg):** The distinction between "Add Flight", "Add Sector", "Add Leg", and "+ + Layover" is undefined, leaving the user guessing which button creates a connecting flight versus a return flight.
3. **Flight Card Collapse State Conceals Inputs:** Flight cards appear as dense, locked boarding pass summaries. First-time users cannot see standard input fields and are unsure whether clicking the card, the text, or the pencil icon will allow them to change the airline.

---

## Screen 6: Editor — Tab 3: Day-by-Day Journey Plan

### 1. Element Inventory & Salesperson Frequency

| Element | Classification | Rationale |
| :--- | :--- | :--- |
| **Panel Title ("Day-by-Day Journey Plan")** | Rarely | Orientation title. |
| **"8 Days Total" Counter Badge** | Sometimes | Verifies itinerary length. |
| **Panel Subtitle Explanation** | Rarely | Descriptive narrative overview. |
| **"+ Add Day" Primary Action Button** | Sometimes | Extends itinerary by adding a new day block. |
| **Day Carousel Navigation Arrows (`<`, `>`)** | Always | Scrolls through day tabs when trips exceed screen width. |
| **Day Selector Pills (`Day 01 (Coco Island)`, etc.)** | Always | Primary navigation between individual days. |
| **Day Editor Header (`#01 EDITING DAY 1 OF 8`)** | Always | Confirms which specific day is being edited. |
| **Autosave Note ("Changes autosave instantly...")** | Rarely | Informational reassurance text. |
| **Day Collapse Chevron / Duplicate / Trash Buttons** | Sometimes | Structural day management actions. |
| **DAY TITLE * Input Field** | Always | Daily headline printed on itinerary timeline. |
| **DAY NARRATIVE & SCHEDULE Multi-line Textarea** | Always | Core storytelling and schedule details for the day. |
| **STAY & ACCOMMODATION Header (Bed Icon)** | Rarely | Section divider. |
| **Hotel / Property Name Input (Building Icon)** | Always | Accommodations provided for the night. |
| **City / Location Input (Location Pin Icon)** | Always | Destination where the stay takes place. |
| **Room Category / Type Input** | Always | Specified room classification (`Lux Suite`, `Deluxe Pool Villa`). |
| **MEALS INCLUDED Header** | Rarely | Section divider. |
| **Meal Toggle Pills (`☕ Breakfast +`, `🍴 Lunch +`, `🌙 Dinner +`)** | Always | Click-to-include meal plan badges. |
| **ACTIVITIES & SIGHTSEEING HIGHLIGHTS Header** | Rarely | Section divider. |
| **Activity Chips (`Arrive at Phuket airport ×`, etc.)** | Always | Highlighted bullet points printed in PDF. |
| **Add Activity Input ("Type activity... and press Enter")** | Sometimes | Custom activity entry. |
| **"+ Add" Navy Button** | Sometimes | Explicit click target for adding activity. |
| **QUICK ADD Activity Pills (`+ City Tour`, `+ Sunset Cruise`...)** | Sometimes | One-click preset activity tags. |
| **DAY PHOTO BANNER (UNSPLASH / PEXELS) Header** | Rarely | Section divider. |
| **Day Photo Placeholder Box ("No Photo Selected for Day 1")** | Sometimes | Visual status indicator for day imagery. |
| **"Choose Photo" Button (Navy + Image Icon)** | Always | Opens photo picker for day hero banner. |
| **Bottom Stepper Bar ("Previous Step", "Next: Inclusions >")** | Always | Workflow navigation. |

### 2. Extended Text Blocks
* **Panel Subtitle:** `"Daily itinerary narratives, stays, meals, and curated visual photo banners."`
* **Autosave Note:** `"Changes autosave instantly to itinerary state."`
* **Day Narrative Sample Text:** `"Welcome to Thailand! Arrive at Phuket airport and transfer to your hotel on Coco Island. Check-in and spend the evening relaxing by the beach or enjoying the property's amenities and music."`
* **Activity Input Placeholder:** `"Type activity (e.g. Shikara Ride on Dal Lake) and press Enter"`
* **Day Photo Subtitle:** `"Curate a high-resolution banner photo for the proposal page."`

### 3. Inconsistencies (Buttons, Spacing, Fonts, Colours)
* **Day Pill Carousel Hierarchy:** The active day (`Day 01`) turns solid dark navy with white text, but inactive days are light grey buttons with black text and subtle borders. When a day has no hotel or photo attached, there is no missing-data badge or warning dot on the pill to guide the user.
* **Meal Pill Toggle States:** The meal buttons (`Breakfast +`, `Lunch +`, `Dinner +`) use a trailing plus sign `+` even when they are active. There is no clear contrast between unselected and selected states (e.g., standard checkmarks vs plus signs), making it hard to tell at a glance whether lunch is included.
* **Tag Input Divergence:** Destination tags on Tab 1 have blue pill backgrounds with rounded corners. Activity tags on Tab 3 have neutral light grey backgrounds with squared pill corners, creating visual inconsistency across similar tag-input mechanisms.

### 4. Top 3 Intimidation Factors for a First-Time User
1. **Tedious Day-by-Day Carousel Hopping:** Having to click through 8 separate pills (`Day 01` through `Day 08`) and fill out 7 fields per day creates cognitive exhaustion and prevents taking in the whole trip flow at a glance.
2. **Uncertainty Over Photo Requirement:** Every day card features a prominent `"No Photo Selected for Day X"` placeholder box. A first-time salesperson cannot tell whether selecting 8 separate photos is mandatory for the PDF to look polished.
3. **Ambiguity on Meals Inclusion:** The trailing plus symbol (`+`) on meal pills creates uncertainty whether clicking the button adds a meal or indicates that the meal is already attached to the booking.

---

## Screen 7: Editor — Tab 4: Inclusions, Exclusions & Booking Policies

### 1. Element Inventory & Salesperson Frequency

| Element | Classification | Rationale |
| :--- | :--- | :--- |
| **"WHAT IS INCLUDED (7)" Header & Green Checkmark** | Always | Governs deliverables covered by agency quote. |
| **"Client Covered" Green Badge** | Rarely | Informational status tag. |
| **QUICK ADD PRESETS: Inclusions (7 pill tags)** | Sometimes | One-click entry for standard deliverables. |
| **Included Items List (7 individual rows with trash icons)** | Always | Reviewing and tailoring package inclusions. |
| **Add Custom Inclusion Input & "+ Add" Button** | Sometimes | Appending custom contractual deliverables. |
| **"WHAT IS EXCLUDED (5)" Header & Red Circle X** | Always | Protects agency from client liability. |
| **"Not Included" Red Badge** | Rarely | Informational status tag. |
| **QUICK ADD PRESETS: Exclusions (7 pill tags)** | Sometimes | One-click entry for standard non-deliverables. |
| **Excluded Items List (5 individual rows with trash icons)** | Always | Reviewing out-of-scope items. |
| **Add Custom Exclusion Input & "+ Add" Button** | Sometimes | Appending custom contractual exclusions. |
| **"Payment Milestones & Cancellation Policy" Header** | Always | Commercial terms and legal policy container. |
| **"0 Milestones • 0 Slabs" Counter Badge** | Always | Warns that payment/cancellation terms are currently missing. |
| **"Load Standard Policy" Primary Action Button** | Always | Fast one-click fix to populate default agency milestones. |
| **"PAYMENT SCHEDULE MILESTONES (0)" Sub-section Header** | Sometimes | Header for payment schedule breakdown. |
| **QUICK ADD MILESTONES (4 percentage pills)** | Sometimes | One-click milestones (`25% deposit`, `50% payment...`). |
| **Milestones Empty State Notification** | Sometimes | Explains missing payment terms. |
| **Custom Milestone Input & "+ Add" Button** | Sometimes | Specifying non-standard payment splits. |
| **"CANCELLATION SLABS TABLE (0)" Sub-section Header** | Sometimes | Header for deduction penalty schedules. |
| **Cancellation Table Headers (Window, Fee, Action)** | Rarely | Structural table labels. |
| **Cancellation Empty State Notification** | Sometimes | Explains missing cancellation tiers. |
| **Inline Window Input (`15-29 days prior`)** | Sometimes | Defining custom cancellation period. |
| **Inline Fee Input (`25% non-refundable`)** | Sometimes | Defining penalty charge. |
| **"+ Add Slab" Action Button** | Sometimes | Commits custom cancellation tier to table. |
| **Bottom Stepper Bar ("Previous Step", "Next: Pricing >")** | Always | Workflow navigation. |

### 2. Extended Text Blocks
* **Policy Card Subtitle:** `"Renders legal booking terms and cancellation slabs on Page 4 of the proposal."`
* **Milestones Empty State Notice:** `"No payment terms specified. Click “Load Standard Policy” or add milestones below."`
* **Cancellation Empty State Notice:** `"No cancellation slabs defined. Click “Load Standard Policy” above to populate standard tiers."`
* **Inclusion Input Placeholder:** `"Type custom inclusion and press Enter..."`
* **Exclusion Input Placeholder:** `"Type custom exclusion and press Enter..."`
* **Milestone Input Placeholder:** `"Type custom milestone (e.g. 50% deposit on booking) and press Enter..."`
* **Cancellation Window Placeholder:** `"Window (e.g. 15-29 days prior)"`
* **Cancellation Fee Placeholder:** `"Fee (e.g. 25% non-refundable)"`

### 3. Inconsistencies (Buttons, Spacing, Fonts, Colours)
* **Preset Tag Color Confusion:** Inclusion presets feature blue outline pills with small green plus signs. Exclusion presets feature identical blue outline pills with small red plus signs. The text inside both sets is monochrome dark slate, reducing peripheral differentiation between included and excluded presets.
* **Button Proliferation:** Within a single screen view, there are 5 identical `+ Add` solid navy buttons (Inclusions, Exclusions, Milestones, Cancellation Slabs) alongside a prominent dark navy `Load Standard Policy` button with a gold star icon.
* **Truncated Item Text:** The second inclusion row displays `"07 Night stay in hotel (1-night Coco island +2-night Krabi+2..."` with an ellipsis cut-off in the text input, concealing critical package details from immediate view.

### 4. Top 3 Intimidation Factors for a First-Time User
1. **Fear of Missing Legal Terms:** Seeing `"0 Milestones • 0 Slabs"` highlighted in grey pills next to an empty cancellation table creates intense liability anxiety that the proposal is legally incomplete.
2. **Dense Multi-List Stacking:** Presenting two large side-by-side inclusion/exclusion lists on top of two stacked legal policy cards creates a text-heavy, intimidating screen that feels more like legal contract drafting than travel sales.
3. **Ambiguity Over "Load Standard Policy":** The user is not told what `"Load Standard Policy"` will actually inject into the document before clicking it, creating hesitation that it might overwrite custom client terms.

---

## Screen 8: Editor — Tab 5: Pricing, Commercials & Margins

### 1. Element Inventory & Salesperson Frequency

| Element | Classification | Rationale |
| :--- | :--- | :--- |
| **Confidentiality Warning Subtitle** | Always | Reassures salesperson that profit margins are hidden from clients. |
| **PRICING CALCULATION MODEL Header** | Rarely | Section divider. |
| **Model 1: "1. SUPPLIER DMC PACKAGE" Card (ACTIVE Badge)** | Always | Standard package pricing mode. |
| **Model 2: "2. CUSTOM ITEMIZED QUOTE" Card** | Sometimes | Used when breaking down flight, hotel, and visa lines. |
| **Model 3: "3. TOTAL PRICE ONLY" Card** | Sometimes | Direct lumpsum quoting without breakdown. |
| **PRICE DISTRIBUTION Header & "2 Travelers" Badge** | Rarely | Section context. |
| **"Total Only (Standard)" Segment Button** | Always | Controls whether the PDF displays total or per-person pricing. |
| **"Split Per Person (₹/pax)" Segment Button** | Always | Per-pax pricing toggle. |
| **GROUND PACKAGE COMMERCIALS Header** | Rarely | Section divider. |
| **SUPPLIER COST (NET DMC RATE) * Input (`₹ 93,900`)** | Always | Base net cost paid to ground operator. |
| **Net Cost Helper Subtext** | Rarely | Informational label. |
| **AGENCY MARGIN (PROFIT) * Header & "Floor: 8%" Indicator** | Always | Highlights margin compliance threshold. |
| **Markup Type Dropdown (`Percentage (%)`)** | Sometimes | Toggles percentage vs fixed currency markup. |
| **Markup Value Input (`15%`)** | Always | Percentage added to net supplier rate. |
| **Agency Profit Realtime Calculation (`+ ₹ 14,085 (15.0%)`)** | Always | Realtime profit display for salesperson. |
| **Land Selling Subtotal (`₹ 1,07,985`)** | Always | Selling price before flights. |
| **"[ ] ✈ INCLUDE FLIGHT TICKETS IN THIS PROPOSAL" Checkbox** | Always | Toggles flight ticket price integration into proposal quote. |
| **Flight Inclusion Subtext Note** | Sometimes | Explains Land-Only rendering mode. |
| **EXECUTIVE COMMERCIAL BREAKDOWN Card (Navy Banner)** | Always | High-visibility executive commercial summary. |
| **Breakdown Subtotals ("• Land Package", "• Agency Margin")** | Always | Internal commercial breakdown. |
| **TOTAL CLIENT SELLING PRICE Header** | Always | Client price label. |
| **Huge Display Price (`₹ 1,07,985`)** | Always | Final printed client proposal price. |
| **"✓ Markup 100% hidden on client PDF" Green Subtext** | Always | Critical confidentiality guarantee. |
| **Pricing Basis Dropdown (`Per Person Twin Sharing`)** | Sometimes | Clarifies hotel occupancy basis. |
| **Quote Validity (Days) Input (`7`)** | Sometimes | Specifies proposal expiration deadline. |
| **Bottom Stepper Bar ("Previous Step", "Generate Client PDF" Red Button)** | Always | Final workflow conversion trigger. |

### 2. Extended Text Blocks
* **Top Subtitle:** `"Set customer quotes and margins. Markup is strictly confidential and never visible on client PDFs."`
* **Model 1 Description:** `"DMC ground rate + agency margin, with optional flight bolt-on."`
* **Model 2 Description:** `"Itemized 4-pillar quote: Flight, Land Part, Hotel, and Visa."`
* **Model 3 Description:** `"Single lumpsum quote with no breakup and no markup."`
* **Net Cost Subtext:** `"Net rate billed by your local DMC / ground partner."`
* **Flight Checkbox Subtext:** `"Flights are excluded from this quote. Proposal will render as Land-Only package."`
* **Confidentiality Reassurance:** `"✓ Markup 100% hidden on client PDF"`

### 3. Inconsistencies (Buttons, Spacing, Fonts, Colours)
* **Pricing Model Card Hierarchy:** The active model (`1. SUPPLIER DMC PACKAGE`) uses a deep navy background with white text and an orange `ACTIVE` badge. The other two models use white cards with light grey borders and subtle icons, making them appear completely disabled rather than selectable alternatives.
* **Typography Contrast in Commercial Breakdown:** Inside the dark navy breakdown banner, labels are styled in small uppercase gold (`EXECUTIVE COMMERCIAL BREAKDOWN`), green (`• Agency Margin`), light blue (`TOTAL CLIENT SELLING PRICE`), and stark white bold for the final number (`₹ 1,07,985`). This introduces four distinct colors within a single 80px-high container.
* **Currency Formatting Inconsistency:** The supplier cost field displays `₹ 93,900` with spaces between the symbol and digits. The summary card displays `₹ 1,07,985` with similar spacing, but calculation subtexts sometimes omit the space or use varying parenthesis notation (`(15.0%)` vs `(15%)`).

### 4. Top 3 Intimidation Factors for a First-Time User
1. **Fear of Leaking Agency Profit to the Client:** Despite reassurance badges, entering sensitive net supplier costs and profit percentages on the same screen that creates a client PDF creates paranoia that markup will appear on the printed document.
2. **Ambiguity in Flight Cost Integration:** The checkbox `"INCLUDE FLIGHT TICKETS IN THIS PROPOSAL"` does not state what flight price will be added or where it originates (especially since Tab 2 captures flight schedules without ticket prices).
3. **Complex Commercial Mode Terminology:** Presenting three technical financial models (`Supplier DMC Package`, `Custom Itemized Quote`, `Total Price Only`) makes a first-time user pause in confusion over which card correctly represents a straightforward tour quote.

---

## Screen 9: Editor — Live Client HTML/PDF Preview Pane

### 1. Element Inventory & Salesperson Frequency

| Element | Classification | Rationale |
| :--- | :--- | :--- |
| **"Live Client HTML Preview" Header & Green Status Dot** | Rarely | Technical panel title. |
| **"Updates on keystroke" Refresh Subtext & Icon Button** | Sometimes | Re-renders preview if automatic sync lags. |
| **Sticky Action Bar ("LIVE CLIENT PREVIEW")** | Rarely | Section banner. |
| **Estimated Page Count (`Est. A4 Print Pages: ~3–4`)** | Sometimes | Informs the user of the final document length. |
| **"Print / Save PDF" Action Button (Bright Blue)** | Always | Direct shortcut to launch browser print dialogue. |
| **A4 Document Simulation Canvas** | Always | Verifies layout, page breaks, and visual presentation. |
| **Cover Header Trust Strip (`1M+ TRAVELLERS...`)** | Sometimes | Verifies corporate credibility branding. |
| **Cover Hero Photo Display** | Always | Immediate visual check of front cover aesthetics. |
| **Curated Subtitle & Golden Accent Line** | Sometimes | Visual brand styling. |
| **Headline Package Title** | Always | Verifies typography and line breaks on cover. |
| **Circuit Destination Bullet Points** | Always | Confirms route accuracy on Page 1. |
| **Client Overview Vignette Card (Navy Bottom Box)** | Always | Validates guest name, dates, duration, and traveler counts. |

### 2. Extended Text Blocks
* **Top Bar Sync Note:** `"Updates on keystroke"`
* **Page Count Estimator:** `"Est. A4 Print Pages: ~3–4"`
* **Trust Strip Headline:** `"1M+ TRAVELLERS • TRIPPYGO A UNIT OF FRIENDS TRAVELS • 18+ YEARS OF EXPERIENCE YOUR TRUSTED TRAVEL PARTNER"`
* **Editorial Tag:** `"CURATED PRIVATE ITINERARY"`
* **Client Vignette Header:** `"SPECIALLY PREPARED FOR VALUED TRAVELLER"`

### 3. Inconsistencies (Buttons, Spacing, Fonts, Colours)
* **Competing Primary Action Buttons:** At the top right of the editor shell sits a large solid red button (`Generate Client PDF`). Directly inside the preview pane sits another prominent bright blue button (`Print / Save PDF`). Both buttons initiate output generation, but use conflicting colors and slightly different execution flows.
* **Estimated vs Actual Page Count Discrepancy:** The estimator indicates `"Est. A4 Print Pages: ~3–4"`, whereas the complete proposal with 8 days, flights, stays, terms, and back cover actually spans 14 A4 pages, causing confusion regarding document length.
* **Canvas Zoom Controls Absence:** The preview pane displays a scaled-down A4 document preview, but provides no zoom controls (`100%`, `Fit Width`, `Page View`) or page switcher arrows, forcing the user to squint at micro-typography on compact laptop displays.

### 4. Top 3 Intimidation Factors for a First-Time User
1. **Uncertainty Over Page Breaks:** The continuous preview canvas does not show where A4 page breaks will slice through day itineraries, leaving the salesperson anxious that content might get cut in half.
2. **Conflicting Generation Triggers:** Having two differently styled buttons for generating the PDF (`Generate Client PDF` in red vs `Print / Save PDF` in bright blue) creates indecision about which button produces the correct client-ready file.
3. **Illegible Micro-Scale Text:** Displaying a full multi-page document in a narrow 400px side column shrinks body copy to 5–6px equivalent, making it impossible to read day descriptions without generating the actual PDF.

---

## Screen 10: Modal — New Itinerary Intake

### 1. Element Inventory & Salesperson Frequency

| Element | Classification | Rationale |
| :--- | :--- | :--- |
| **Modal Header: "Create New Itinerary"** | Always | Confirms modal purpose. |
| **Subtitle Explanation** | Rarely | Explains AI parsing capabilities. |
| **Close Modal Button (`✕`)** | Always | Cancels intake workflow. |
| **Tab 1: "Upload PDF / Doc" (Active, Red Underline)** | Always | Primary route for parsing supplier quotation documents. |
| **Tab 2: "Paste WhatsApp / Text"** | Sometimes | Common channel when suppliers provide unstructured text chats. |
| **Tab 3: "Start Blank"** | Sometimes | Used when building custom itineraries from scratch. |
| **Dropzone Container (Dashed Rounded Border)** | Always | Interactive drag-and-drop file target. |
| **Cloud Upload Icon** | Rarely | Visual affordance for upload area. |
| **"Drop supplier PDF here or click to browse" Prompt** | Always | Primary instruction for file intake. |
| **File Format & Size Limit Subtext (`PDF or TXT up to 50 MB`)** | Sometimes | Informs allowable file specs. |
| **"Cancel" Action Button (Ghost Text)** | Sometimes | Dismisses modal without saving. |
| **"Extract & Open Editor →" Primary Button (Light Coral)** | Always | Initiates AI extraction pipeline. |

### 2. Extended Text Blocks
* **Modal Subtitle:** `"Parse raw supplier notes into a client-ready proposal with AI"`
* **Dropzone Headline:** `"Drop supplier PDF here or click to browse"`
* **File Specification Subtext:** `"Supports PDF or TXT up to 50 MB"`
* **Commit Button Label:** `"Extract & Open Editor →"`

### 3. Inconsistencies (Buttons, Spacing, Fonts, Colours)
* **Disabled vs Active Button State:** The primary action button `"Extract & Open Editor →"` uses a light desaturated coral color (`#f87171` opacity) in its empty state. It does not look explicitly disabled (no grey background or disabled cursor), misleading users into clicking it before dropping a file.
* **Underline vs Pill Navigation:** In the main app tabs, active navigation is represented by dark navy pill buttons. In this modal, active navigation switches to an underlined red text tab, breaking tab navigation consistency.
* **File Format Label Discrepancy:** The tab title reads `"Upload PDF / Doc"`, but the dropzone subtext states `"Supports PDF or TXT up to 50 MB"`, leaving users uncertain whether Microsoft Word (`.docx`) files are accepted.

### 4. Top 3 Intimidation Factors for a First-Time User
1. **Black-Box AI Extraction Anxiety:** The subtitle `"Parse raw supplier notes into a client-ready proposal with AI"` gives no explanation of how long extraction takes, whether it costs credits, or what happens if the supplier PDF contains messy tables.
2. **Ambiguous Empty Primary Button:** The light coral styling on `"Extract & Open Editor →"` looks like an active red button, leading users to wonder why clicking it does nothing when no file is uploaded.
3. **Fear of Uploading the Wrong Supplier Document:** Users worry that uploading a supplier quote containing private B2B DMC rates might accidentally bake those wholesale costs directly into client-facing text fields.

---

## Screen 11: Modal — Live Flight Search & Layovers

### 1. Element Inventory & Salesperson Frequency

| Element | Classification | Rationale |
| :--- | :--- | :--- |
| **Modal Header Icon & Title ("Search Live Flights & Layovers")** | Always | Orientation header. |
| **Header Subtitle Explanation** | Rarely | Technical capability summary. |
| **Close Modal Button (`✕`)** | Always | Closes search modal. |
| **Mode Toggle: "Search Route & Layovers" (Active Navy)** | Always | Route-based search mode. |
| **Mode Toggle: "Flight Number Lookup"** | Sometimes | Searching specific flight numbers (`6E 1024`). |
| **Journey Direction: "Going (Outbound)" (Active Navy)** | Always | Assigns flight to outbound section. |
| **Journey Direction: "Return (Inbound)"** | Always | Assigns flight to inbound return section. |
| **Journey Direction: "Add as New Flight Leg"** | Sometimes | Adds standalone sector. |
| **ORIGIN POINT Input (`DEL`)** | Always | Departure airport code or city name. |
| **Swap Route Arrow Button (`⇆`)** | Sometimes | Reverses origin and destination. |
| **DESTINATION Input (`HKT`)** | Always | Arrival airport code or city name. |
| **TRAVEL DATE Date Picker (`11-02-2026`)** | Always | Flight scheduling date. |
| **"Search Flights" Primary Action Button (Navy + Magnifier)** | Always | Executes live schedule lookup. |
| **Popular Airport Suggestion Chips (`DEL`, `BOM`, `BLR`...)** | Sometimes | Quick-fill origin codes. |
| **Empty Results Icon & Prompt ("Type any city name...")** | Sometimes | Informs search criteria. |
| **Footer Reassurance Subtext** | Rarely | Informational boarding pass generation note. |
| **"Cancel" Action Button (Ghost)** | Sometimes | Dismisses modal without adding flights. |

### 2. Extended Text Blocks
* **Header Subtitle:** `"Discover authentic carrier schedules, connecting routes with layovers, and direct flight numbers."`
* **Popular Chips Prefix:** `"Popular: DEL (Delhi), BOM (Mumbai), BLR (Bengaluru), GOI (Goa), SXR (Srinagar), BKK (Bangkok)"`
* **Empty State Instructions:** `"Type any city name or airport code (e.g. Phu Quoc, Delhi, Bangkok) to view live carrier schedules and connecting routes."`
* **Footer Informational Note:** `"Connecting flights automatically generate authentic boarding passes with layover calculations."`

### 3. Inconsistencies (Buttons, Spacing, Fonts, Colours)
* **Multiple Concurrent Active Toggles:** The top of the modal contains two separate pill groups side-by-side: `Search Route & Layovers` (Navy) and `Going (Outbound)` (Navy). Both use the identical solid dark navy treatment, making it difficult to understand which toggle controls search method vs flight assignment.
* **Origin/Destination Input Height Discrepancy:** The text inputs for origin and destination are standard 40px text boxes, but the calendar date picker next to them has different padding and a native browser dropdown arrow, causing visual baseline misalignment.
* **Subtle Airport Chips:** Popular chips below the form are plain light grey pills with faint text, making them look like disabled filters rather than clickable quick-fill helpers.

### 4. Top 3 Intimidation Factors for a First-Time User
1. **Expectation of Live GDS Pricing:** The title `"Search Live Flights & Layovers"` sounds like a consumer flight booking tool (like Google Flights or Skyscanner). Sales reps may panic when no live ticket prices or seat availability appear in the results.
2. **Ambiguity Over Flight Leg Placement:** The presence of three separate journey toggles (`Going`, `Return`, `Add as New Flight Leg`) forces the user to make a structural taxonomy decision before they have even seen available flights.
3. **Airport Code Requirement Apprehension:** Seeing 3-letter IATA codes (`DEL`, `HKT`) makes new sales reps worry that entering full city names like "Phuket" will cause the flight search engine to fail.

---

## Screen 12: Modal — Cover Photo Picker (Curated Presets & Stock Search)

### 1. Element Inventory & Salesperson Frequency

| Element | Classification | Rationale |
| :--- | :--- | :--- |
| **Modal Header & Compass Icon** | Always | Confirms cover photo curation purpose. |
| **Subtitle with Aspect Ratio & Safe Zone Guidance** | Sometimes | Reminds user of focal framing rules. |
| **"Safe Zone ON" Golden Action Pill** | Sometimes | Toggles the 45% visual safe-zone overlay on thumbnails. |
| **Close Modal Button (`✕`)** | Always | Dismisses modal. |
| **Tab 1: "Curated Luxury Presets [23]" (Active, Gold Badge)** | Always | Accesses pre-approved high-res luxury travel banners. |
| **Tab 2: "Multi-Stock Portrait Search"** | Sometimes | Searches external Unsplash/Pexels image libraries. |
| **Tab 3: "Custom Upload & Crop"** | Sometimes | Uploading custom agency photography. |
| **Right Spec Label (`A4 Editorial Luxury Spec (1:1.414)`)** | Rarely | Technical design system specification. |
| **Region Filter Pills ("All", "Matching (Phuket)", "Middle East"...)** | Always | Filters photo library by destination relevance. |
| **"★ Matching (Phuket)" Recommended Filter Pill** | Always | Priority smart filter matching current proposal destination. |
| **Photo Cards (10 visible in 2x5 grid)** | Always | Image selection candidates. |
| **Photo Thumbnail Preview** | Always | Visual quality assessment. |
| **Region Badge on Photo (`MIDDLE EAST`, `SOUTHEAST ASIA`)** | Sometimes | Validates geographic accuracy. |
| **Photo Title (`Burj Khalifa Twilight Sky`, etc.)** | Sometimes | Identifies landmark. |
| **Attribution & Source Tag (`Photo: David Rodrigo • UNSPLASH`)** | Rarely | Legal copyright attribution metadata. |
| **"Apply Cover" Action Link (Blue Text)** | Always | Commits chosen image as front cover hero. |
| **Footer Note ("Tip: Press ESC to close.")** | Rarely | Keyboard shortcut hint. |
| **"Cancel" Button (Ghost Pill)** | Sometimes | Dismisses modal. |

### 2. Extended Text Blocks
* **Header Subtitle:** `"Sourced in high-resolution A4 portrait ratio (1:1.414). Keep subject centered in the 45% safe zone."`
* **Footer Keyboard Hint:** `"Tip: Press ESC to close."`
* **Sample Photo Titles & Credits:**
  * `"Burj Khalifa Twilight Sky • Photo: David Rodrigo • UNSPLASH"`
  * `"Arabian Desert Golden... • Photo: NASA / Unsplash • UNSPLASH"`
  * `"Ulun Danu Beratan Temple • Photo: Oliver Sjöström • UNSPLASH"`
  * `"Phi Phi Island Longtail Boat • UNSPLASH"`

### 3. Inconsistencies (Buttons, Spacing, Fonts, Colours)
* **Image Selection Trigger Styling:** Each photo card uses a plain text link `"Apply Cover"` in light blue font tucked into the bottom right corner. It has no button border or background, providing very weak affordance for the most critical action in the modal.
* **Missing Image Placeholder Broken State:** The third card in the top row (`Sheikh Zayed Grand...`) displays an unfilled black card with raw blue text reading `Sheikh Zayed Grand Mosque` overlapping the region pill, indicating an image load failure without a graceful fallback state.
* **Tag Style Divergence:** The "Region" filter row has standard pill buttons, but the "★ Matching (Phuket)" pill has a white background with a star icon and black text, making it look like a selected search tag rather than a filter toggle.

### 4. Top 3 Intimidation Factors for a First-Time User
1. **Broken Image Thumbnail Fear:** Encountering a black, broken image card (`Sheikh Zayed Grand...`) on the first screen creates fear that selecting photos might crash the PDF rendering engine.
2. **Safe-Zone Jargon Confusion:** The instruction `"Keep subject centered in the 45% safe zone"` alongside a golden `"Safe Zone ON"` toggle introduces specialized graphic design concepts that intimidate a salesperson looking for a quick resort photo.
3. **Weak Click Target Affordance:** The small blue text link `"Apply Cover"` is easy to miss. Users instinctively click the image thumbnail itself, but nothing happens if the image container does not have an active click handler.

---

## Screen 13: Modal — Cover Photo Picker (Custom Upload Dropzone)

### 1. Element Inventory & Salesperson Frequency

| Element | Classification | Rationale |
| :--- | :--- | :--- |
| **Modal Header & Compass Icon** | Always | Orientation header. |
| **Subtitle Explanation** | Rarely | Framing instructions. |
| **"Safe Zone ON" Golden Action Pill** | Rarely | Safe zone guide toggle. |
| **Close Modal Button (`✕`)** | Always | Dismisses modal. |
| **Navigation Tabs (Presets, Search, Custom Upload & Crop)** | Always | Switches between photo acquisition modes. |
| **Dropzone Container (Large Dashed Box)** | Always | Target for dragging custom image files. |
| **Upload Tray Icon in Light Circle** | Rarely | Visual upload affordance. |
| **Headline: "Upload Custom Cover Photo"** | Always | Primary call to action. |
| **Format & Size Specification Subtext** | Sometimes | File constraints (`JPG, PNG, WebP up to 15MB`). |
| **"Browse Photo From Computer" Primary Button (Navy)** | Always | Opens operating system file selection dialog. |
| **Footer Note ("Tip: Press ESC to close.")** | Rarely | Keyboard hint. |
| **"Cancel" Button (Ghost Pill)** | Sometimes | Dismisses modal. |

### 2. Extended Text Blocks
* **Dropzone Headline:** `"Upload Custom Cover Photo"`
* **Specification Subtext:** `"Supports JPG, PNG, WebP up to 15MB. Pan, zoom, and frame the 1:1.414 portrait crop with live safe-zone overlays."`
* **Browse Button Label:** `"Browse Photo From Computer"`

### 3. Inconsistencies (Buttons, Spacing, Fonts, Colours)
* **Underutilised Modal Canvas:** The dropzone box is centered inside a large modal that was sized to hold a 10-item photo grid, resulting in expansive empty grey space around a relatively small dashed container.
* **Button Style Switch:** The `"Browse Photo From Computer"` button is a wide dark navy button with an upload icon, while in Screen 10 (New Itinerary Intake), the upload trigger is a raw click target on the dropzone text with no button at all.
* **Aspect Ratio Reminder Repetition:** The technical ratio `1:1.414` is stated in three separate places on this single screen (Header subtitle, Top tab strip, Dropzone description), creating unnecessary technical clutter.

### 4. Top 3 Intimidation Factors for a First-Time User
1. **Fear of Image Distortion on A4 Prints:** The repeated warnings about `"1:1.414 portrait crop"` and `"safe-zone overlays"` make users terrified that their client's preferred photo will be stretched, squished, or look unprofessional on paper.
2. **File Size and Format Restrictions:** Seeing restrictions like `"WebP up to 15MB"` leaves non-technical users wondering if high-resolution phone photos taken by hotel managers will be rejected.
3. **Uncertainty Over What Happens After Upload:** The screen gives no indication of whether uploading immediately sets the cover or opens an intermediate cropping tool, causing hesitation before committing a file.

---

## Screen 14: Modal — Interactive A4 Portrait Cropper

### 1. Element Inventory & Salesperson Frequency

| Element | Classification | Rationale |
| :--- | :--- | :--- |
| **Cropper Header Banner ("INTERACTIVE A4 PORTRAIT CROPPER")** | Rarely | Orientation banner. |
| **Subtitle ("Drag and zoom photo. Keep the key subject...")** | Sometimes | Cropping instructions. |
| **"Safe Zone ON" Golden Action Pill** | Sometimes | Toggles guideline overlays on/off. |
| **"Reset" Action Button (Ghost)** | Sometimes | Resets zoom and pan coordinates to original state. |
| **Dark Canvas Workspace (Black Background)** | Always | Isolates photo for precise framing. |
| **A4 Aspect Ratio Viewport Frame (Blue Border)** | Always | Represents the exact boundary of the A4 print page. |
| **Zone 1 Overlay: "★ TRIPPYGO HEADER ZONE (0 - 20%)"** | Always | Warns where the top trust badge and logo will occlude the photo. |
| **Zone 2 Overlay: "🎯 PRIMARY FOCAL WINDOW (20 - 65%)"** | Always | Green target box where landmarks must be centered. |
| **Zone 3 Overlay: "TITLE CARD VIGNETTE (65 - 100%)"** | Always | Warns where the dark gradient and client title card will cover the bottom. |
| **Zoom Controls Bar: Zoom Out Icon (`-`)** | Sometimes | Decreases image magnification. |
| **Zoom Slider Control (1.0x to 3.0x)** | Sometimes | Fine zoom adjustment. |
| **Zoom In Icon (`+`)** | Sometimes | Increases image magnification. |
| **Zoom Level Numeric Readout (`1.0x`)** | Sometimes | Current scale factor. |
| **"Cancel" Action Button (Ghost Pill)** | Sometimes | Aborts crop changes. |
| **"Apply A4 Cover Photo" Primary Action Button (Bright Blue)** | Always | Commits cropped coordinates to the proposal cover. |

### 2. Extended Text Blocks
* **Cropper Subtitle:** `"Drag and zoom photo. Keep the key subject in the center 45% safe focal window."`
* **Top Zone Overlay Text:** `"★ TRIPPYGO HEADER ZONE (0 - 20%) - Top trust badges & logo will sit here"`
* **Center Zone Overlay Text:** `"🎯 PRIMARY FOCAL WINDOW (20 - 65%) - Keep mountains, monuments, or landmarks centered here"`
* **Bottom Zone Overlay Text:** `"TITLE CARD VIGNETTE (65 - 100%) - Destination, nights, and client name are placed here"`

### 3. Inconsistencies (Buttons, Spacing, Fonts, Colours)
* **Bright Blue Primary Button Anomaly:** The primary commit button `"Apply A4 Cover Photo"` is rendered in electric royal blue (`#2563eb`). Throughout the rest of the application, primary commit actions are either dark navy (`#091c3e`) or deep red (`#c92229`).
* **Overlay Text Legibility Clashing:** The safe-zone guide overlays use dashed yellow borders and bright green translucent fills with uppercase white/green text. When an image contains vibrant red or yellow tones, this creates high visual noise and makes reading both the photo and the guidelines difficult.
* **Dual "Safe Zone" Toggles:** The golden button `"Safe Zone ON"` appears both in the top modal header and again inside the dark cropper toolbar, providing two buttons with identical labels in close proximity.

### 4. Top 3 Intimidation Factors for a First-Time User
1. **Feeling Like a Graphic Designer:** The percentage-based zone overlays (`0-20%`, `20-65%`, `65-100%`) force the user into advanced graphic production responsibilities rather than simple sales proposal creation.
2. **Visual Clutter from Guideline Overlays:** The overlapping yellow dashed boxes, green focal window, and warning labels obscure the very photo the user is trying to evaluate, making it hard to judge aesthetics.
3. **Anxiety Over Obscured Content:** Warnings stating `"Top trust badges & logo will sit here"` and `"Destination, nights, and client name are placed here"` make the salesperson terrified that choosing the wrong zoom level will ruin the client's first impression of the proposal.

---

## Screen 15: Modal — Version History & Audit Trail

### 1. Element Inventory & Salesperson Frequency

| Element | Classification | Rationale |
| :--- | :--- | :--- |
| **Modal Header & Clock History Icon** | Always | Confirms version audit purpose. |
| **Close Modal Button (`✕`)** | Always | Dismisses modal. |
| **Empty State Heading ("No generated versions found yet.")** | Always | Explains why no previous versions are listed. |
| **Empty State Instructional Text** | Always | Explains how to trigger version snapshots. |
| **Footer Cryptographic Disclaimer Banner** | Rarely | Technical explanation of SHA-256 auditing. |

### 2. Extended Text Blocks
* **Empty State Heading:** `"No generated versions found yet."`
* **Empty State Body:** `"Click “Generate Client PDF” in the editor to record an immutable version snapshot with SHA-256 verification."`
* **Footer Audit Disclaimer:** `"Every PDF generation records an immutable snapshot with cryptographic hash for full B2B auditing."`

### 3. Inconsistencies (Buttons, Spacing, Fonts, Colours)
* **Lack of Actionable Triggers:** The body text instructs the user: `"Click “Generate Client PDF” in the editor to record an immutable version snapshot"`. However, there is no button inside this modal to trigger that generation; the user must close the modal to find the red button on the main screen.
* **Cryptographic Jargon:** The terminology `"immutable version snapshot with SHA-256 verification"` and `"cryptographic hash for full B2B auditing"` belongs to blockchain or database security software, clashing with the hospitality tone of a travel proposal tool.
* **Dark Container vs Light System Dialogs:** While all other modals (New Itinerary, Image Picker, Flight Search) use clean white card backgrounds, this modal uses a dark navy container, creating inconsistent dialog themes across the app.

### 4. Top 3 Intimidation Factors for a First-Time User
1. **Cryptographic Jargon Overload:** Terms like `"immutable version snapshot"`, `"SHA-256 verification"`, and `"cryptographic hash"` make sales reps worry they are interacting with an immutable legal compliance system where errors cannot be undone.
2. **Dead-End Empty State:** Opening the version history produces a stark empty dialog with zero interactive controls other than the close `✕` button, leaving the user with an unhelpful dead end.
3. **Fear of Permanent Record:** The phrase `"Every PDF generation records an immutable snapshot"` creates anxiety that testing or drafting an incomplete proposal will permanently log mistakes into an unerasable company audit trail.

---

## Summary of Global UX & UI Anti-Patterns

Across the entire application, four recurring UX anti-patterns consistently elevate cognitive load:

```
+----------------------------------------------------------------------------------------------------+
| 1. TECHNICAL TERMINOLOGY OVERLOAD                                                                 |
|    - Aspect ratio notation: "A4 Portrait (1:1.414)"                                               |
|    - Cryptographic verification: "SHA-256 immutable snapshots"                                    |
|    - Statutory taxation codes: "SAC Code 998552", "TCS under Sec 206C"                             |
|    - Safe zone percentages: "Primary focal window (20 - 65%)"                                     |
+----------------------------------------------------------------------------------------------------+
| 2. BUTTON & COLOR SEMANTIC CONFUSION                                                              |
|    - 3 different primary commit colors: Navy (#091c3e), Red (#c92229), Electric Blue (#2563eb)    |
|    - Orange used simultaneously for valid settings, edit warnings, and active navigation badges   |
|    - Multiple variations of "+ Add" on the same view (split buttons, text links, outline pills)   |
+----------------------------------------------------------------------------------------------------+
| 3. INCOMPLETE OR SKEWED DATA FEEDBACK                                                             |
|    - Dashboard displays "TOTAL PIPELINE QUOTED: ₹0" despite 49 active proposals                   |
|    - Flight cards display incomplete extractions ("Airline: Airline", "00:00") without warnings   |
|    - Page count estimator indicates "~3-4 pages" when the actual proposal spans 14 pages          |
+----------------------------------------------------------------------------------------------------+
| 4. EXCESSIVE FORM DENSITY & SEQUENTIAL WIZARD RIGIDITY                                            |
|    - 5 rigid steps with keyboard shortcut hints suggest a strict wizard rather than a workspace   |
|    - Unpaginated 49-row tables and dense multi-card tabs overwhelm standard 13-14" laptop screens |
|    - Day-by-day itinerary requires hopping through 8 separate tabs, hiding holistic trip flow     |
+----------------------------------------------------------------------------------------------------+
```
