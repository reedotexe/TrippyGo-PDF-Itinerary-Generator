# TrippyGo PDF Itinerary Design Specification

> **Version:** 2.0  
> **Inspired by:** Vietnam Itinerary Reference (`Refrences/Vietnam Itinerary`)  
> **Brand Identity:** TrippyGo by Friends Travel (`Brand Assets/TrippyGo`)  
> **Target Format:** High-Resolution A4 Multi-Page PDF Document (Print & Screen Optimized)  
> **Engine:** Playwright Headless Chromium + TailwindCSS / Print CSS3

---

## 1. Executive Design Vision & Aesthetic Direction

### 1.1 The Shift to Luxury Editorial Travel Brochures
Standard B2B travel itineraries are frequently presented as plain, unstyled tables or generic word-processor exports. The TrippyGo design philosophy turns every quotation into an **editorial travel magazine and luxury voucher package**.

Inspired by the benchmark reference (*Vietnam Itinerary - Harkiran Singh*), the TrippyGo itinerary combines:
1. **Bold Visual Cover**: Full-bleed hero photography with dark cinematic vignette overlays, sharp modern sans-serif typography, and floating frosted glass/white cards.
2. **Tactile Voucher Metaphors**:
   - **Flights** styled as physical **Airline Boarding Passes**, complete with perforated vertical cut lines, semi-circular notch cutouts, layover bars, and baggage weight tags.
   - **Accommodations** styled as **Hotel Vouchers** with night count pills, check-in/out schedules, and amenity badges.
   - **Payments** styled as **Commercial Invoices** with dark navy trust banners, dynamic UPI QR codes, and bank wire cards.
3. **Structured Day Narratives**: Clean modular day cards featuring bold titles, date stamps, stay/meal pill tags, and symmetrical two-photo showcase grids.
4. **Emotional & Social Proof Sign-Off**: A grand back-cover spread featuring real traveler photo mosaics, trust badges (Google Reviews, social followings, industry awards), and five core pillars of reliability.

---

## 2. TrippyGo Brand Identity & Color System

TrippyGo's visual signature is built around high-energy **Trippy Red** and confident, professional **Trippy Royal Blue**, grounded by deep oceanic navy backgrounds and accented with warm golden-amber highlights.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        TRIPPYGO COLOR PALETTE                          │
├─────────────────┬──────────────────┬─────────────────┬─────────────────┤
│   TRIPPY RED    │   TRIPPY BLUE    │    DEEP NAVY    │   GOLD ACCENT   │
│     #c92229     │     #1556a6      │     #091c3e     │     #f59e0b     │
│ rgba(201,34,41) │ rgba(21,86,166)  │  rgba(9,28,62)  │ rgba(245,158,11)│
└─────────────────┴──────────────────┴─────────────────┴─────────────────┘
```

### 2.1 Color Tokens & Usage Matrix

| Token Name | Hex Code | RGB | Role / Usage |
| :--- | :--- | :--- | :--- |
| `--brand-red` | `#c92229` | `201, 34, 41` | Primary brand accent: logo text, active badges, key callouts, cancellation penalties |
| `--brand-blue` | `#1556a6` | `21, 86, 166` | Secondary brand accent: logo infinity loop, flight routes, stay badges, links |
| `--brand-navy` | `#091c3e` | `9, 28, 62` | Luxury dark surfaces: table headers, pricing summary hero cards, footer bars |
| `--brand-gold` | `#f59e0b` | `245, 158, 11` | Warm accent: decorative section underlines, hotel night badges, ratings, star icons |
| `--surface-card` | `#ffffff` | `255, 255, 255` | White container cards, floating panels, data tables |
| `--surface-bg` | `#f8fafc` | `248, 250, 252` | Soft background for print pages (avoids harsh glare, prints as pure crisp white) |
| `--surface-tint-red` | `#fef2f2` | `254, 242, 242` | Soft red pill backgrounds (exclusions, cancellation warnings) |
| `--surface-tint-blue` | `#eff6ff` | `239, 246, 255` | Soft blue pill backgrounds (activities, route tags, info notices) |
| `--surface-tint-gold` | `#fffbeb` | `255, 251, 235` | Soft amber tint (flight layovers, security guarantee banners) |
| `--surface-tint-green` | `#ecfdf5` | `236, 253, 245` | Soft emerald tint (inclusions, confirmed status) |
| `--text-primary` | `#0f172a` | `15, 23, 42` | Deep charcoal for headings, pricing values, primary text |
| `--text-body` | `#334155` | `51, 65, 85` | Balanced slate for narrative descriptions, paragraphs, lists |
| `--text-muted` | `#64748b` | `100, 116, 139` | Subtle captions, timestamps, airport names, sub-labels |
| `--border-subtle` | `#e2e8f0` | `226, 232, 240` | Clean 1px card borders, table dividers |

### 2.2 Brand Logo Specifications
- **Full Brand Logo (`Trippygo Logo.png`)**:
  - Wordmark `"Trippy"` rendered in `#c92229` with map pin & ascending airplane icon replacing the dot of `"i"`.
  - Wordmark `"go"` rendered in `#1556a6` with infinity loop geometry.
  - Subtitle `"BY FRIENDS TRAVEL"` in crisp uppercase tracked sans-serif (`#1e293b`).
- **Logo Variants for PDF Templates**:
  1. **Cover Page**: Displayed top-right inside a circular white emblem badge with subtle drop-shadow or cleanly rendered in white/color lockup over transparent dark gradient.
  2. **Page Headers & Footers**: Horizontal compact lockup with tagline `"By Friends Travel"`.
  3. **Back Cover**: Prominent centerpiece brand lockup with cursive *"Thank you for choosing"* and flight path illustration.

---

## 3. Typography Hierarchy & Google Fonts

To achieve the modern magazine feel of the reference document, we implement a cohesive three-tier type scale:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        TYPOGRAPHY SYSTEM                               │
├─────────────────────┬──────────────────┬───────────────────────────────┤
│ Heading / Display   │ Plus Jakarta Sans│ 800 ExtraBold & 700 Bold      │
│ Body & Data         │ Inter            │ 400 Regular & 500 Medium      │
│ Handwritten Accent  │ Caveat / Courgette│ 700 Bold Script               │
│ Monospace Data      │ JetBrains Mono   │ 600 SemiBold (Codes, PNR, ₹) │
└─────────────────────┴──────────────────┴───────────────────────────────┘
```

### 3.1 Type Scales & Usage

| Element | Font Family | Size | Weight | Line Height | Case / Tracking | Color |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Cover Title** | Plus Jakarta Sans | 38px / 2.4rem | 800 ExtraBold | 1.15 | Title / Normal | `#ffffff` |
| **Section Title** | Plus Jakarta Sans | 24px / 1.5rem | 800 ExtraBold | 1.25 | Title / -0.01em | `#091c3e` |
| **Day Title** | Plus Jakarta Sans | 18px / 1.15rem | 700 Bold | 1.3 | Uppercase / Normal | `#091c3e` |
| **Hero Price** | Plus Jakarta Sans / Mono | 32px / 2rem | 900 Black | 1.1 | Normal | `#ffffff` / `#091c3e` |
| **Airport Code** | Plus Jakarta Sans | 24px / 1.5rem | 800 ExtraBold | 1.1 | Uppercase | `#c92229` / `#1556a6` |
| **Body Paragraph** | Inter | 13px / 0.82rem | 400 Regular | 1.55 | Normal | `#334155` |
| **Card Subtitles** | Inter | 11px / 0.7rem | 600 SemiBold | 1.4 | Uppercase / +0.05em | `#64748b` |
| **Badge Pills** | Inter | 11px / 0.7rem | 600 SemiBold | 1.2 | Normal | Contextual |
| **Script Sign-off**| Caveat / Courgette| 36px / 2.25rem | 700 Bold | 1.1 | Cursive Script | `#c92229` / `#f59e0b` |

---

## 4. Page-by-Page Layout & Visual Blueprint

The PDF document follows an 8-stage page flow matching the Vietnam reference architecture:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PAGE FLOW BLUEPRINT                             │
├─────────┬──────────────────────┬───────────────────────────────────────┤
│ Page 1  │ Cover Page           │ Full-bleed hero + Floating client card│
│ Page 2  │ Trip Summary         │ Branded table of daily activities     │
│ Page 3  │ Flight Details       │ Realistic boarding pass ticket cards  │
│ Page 4  │ Stays & Commercials  │ Hotel voucher cards + Dark price card │
│ Page 5+ │ Daily Experiences    │ Modular day cards + 2-photo spreads   │
│ Page N  │ Payment & Banking    │ UPI QR card + NEFT/RTGS bank details  │
│ Page N+1│ Inclusions/Terms     │ Green/Red bullet cards + Cancellation │
│ Page N+2│ Back Cover Sign-Off  │ Photo mosaic + Trust pillars + Footer │
└─────────┴──────────────────────┴───────────────────────────────────────┘
```

---

### 4.1 Page 1: The Cover Page (Hero Showcase)

**Visual Benchmark:** *Reference Page 1*
```
┌──────────────────────────────────────────────────────────────────┐
│                                                     (TG Logo)    │
│                                                                  │
│  [ FULL-BLEED HIGH-RESOLUTION DESTINATION HERO PHOTO ]           │
│  [ Dark gradient overlay: from transparent to 80% black/navy ]  │
│                                                                  │
│  The essence of Vietnam,                                         │
│  beyond the ordinary.                                            │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ 👤  HARKIRAN SINGH                                         │  │
│  │ ────────────────────────────────────────────────────────── │  │
│  │ 📅 DURATION               👥 TRAVELERS                      │  │
│  │    5 Nights / 6 Days         2 Adults                      │  │
│  │                                                            │  │
│  │ ✈️  DESTINATIONS           🗓️ TRAVEL DATE                   │  │
│  │    Vietnam                   16 Nov 2026 – 21 Nov 2026     │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

#### Detailed Element Specifications:
1. **Background**:
   - High-resolution bleed image (e.g. Ba Na Hills, Ha Long Bay, or primary package destination).
   - Linear gradient overlay: `linear-gradient(180deg, rgba(9,28,62,0.2) 0%, rgba(9,28,62,0.4) 50%, rgba(9,28,62,0.85) 100%)`.
2. **Top Right Brand Badge**:
   - White circular disc with `Trippygo Logo.png` or compact monogram.
   - Clean margin of `32px` from top and right edges.
3. **Headline Typography**:
   - Large display text: `The essence of [Destination], beyond the ordinary.`
   - Crisp white with subtle text drop shadow: `drop-shadow(0 2px 8px rgba(0,0,0,0.5))`.
4. **Floating Client Information Card**:
   - Pure white card (`#ffffff`) with `16px` border-radius and `box-shadow: 0 10px 30px rgba(0,0,0,0.15)`.
   - **Header Row**:
     - Circular avatar icon in Trippy Red/Gold (`bg-red-50 text-red-600` or `bg-amber-100 text-amber-700`).
     - Client Name in bold uppercase `font-bold tracking-wide text-slate-900 text-xl`.
   - **Divider Line**: Subtle `1px solid #f1f5f9`.
   - **2x2 Information Grid**:
     - Light gray pill background for icons (`w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center`).
     - Label: `text-[10px] uppercase font-bold tracking-wider text-slate-400`.
     - Value: `text-sm font-bold text-slate-900`.
     - Fields: **DURATION**, **TRAVELERS**, **DESTINATIONS**, **TRAVEL DATE**.

---

### 4.2 Page 2: Trip Summary (At a Glance Table)

**Visual Benchmark:** *Reference Page 2*
```
┌──────────────────────────────────────────────────────────────────┐
│                           Trip Summary                           │
│                              ─────                               │
│                                                                  │
│ ┌──────────────────────────────────────────────────────────────┐ │
│ │  DAY   │  DATE         │  ACTIVITY                           │ │ (Deep Navy Header)
│ ├────────┼───────────────┼─────────────────────────────────────┤ │
│ │  Day 1 │  Mon, Nov 16  │  Flight to Hanoi + Half Day City... │ │
│ ├────────┼───────────────┼─────────────────────────────────────┤ │
│ │  Day 2 │  Tue, Nov 17  │  Ninh Binh – Hoa Lu – Tam Coc Tour  │ │
│ ├────────┼───────────────┼─────────────────────────────────────┤ │
│ │  Day 3 │  Wed, Nov 18  │  HALONG BAY – DELUXE DAY CRUISE     │ │
│ └────────┴───────────────┴─────────────────────────────────────┘ │
│                                                                  │
│ ──────────────────────────────────────────────────────────────── │
│ TrippyGo by Friends Travel | Page 2                              │
└──────────────────────────────────────────────────────────────────┘
```

#### Detailed Element Specifications:
1. **Section Header**:
   - Centered `Trip Summary` heading in Deep Navy (`#091c3e`), 28px font size.
   - Decorative accent bar centered below heading: `width: 50px`, `height: 4px`, `background: var(--brand-red)`, `border-radius: 2px`.
2. **Table Container**:
   - Container with `border-radius: 12px`, `border: 1px solid #e2e8f0`, `overflow: hidden`.
3. **Table Header**:
   - Background: `Deep Navy (#091c3e)`.
   - Text: Crisp white uppercase `text-xs font-bold tracking-wider`.
   - Columns:
     - `DAY`: Fixed width `90px`, center/left aligned.
     - `DATE`: Fixed width `140px`.
     - `ACTIVITY`: Flexible remaining width.
4. **Table Rows**:
   - Alternating row styling: Even rows `#ffffff`, odd rows `#f8fafc`.
   - `Day X` text in `font-bold text-slate-900`.
   - Date text in `font-medium text-slate-600`.
   - Activity text in `font-medium text-slate-800`.
   - Padding: `14px 18px` per cell for generous visual breathing room.
5. **Page Footer**:
   - Full-width dark navy bar (`#091c3e`) at bottom margin with thin golden top border (`2px solid #f59e0b` or `#c92229`).
   - White text: `TrippyGo by Friends Travel | Page X`.

---

### 4.3 Page 3: Flight Details (Boarding Pass Cards)

**Visual Benchmark:** *Reference Page 3*
```
┌──────────────────────────────────────────────────────────────────┐
│                              Flights                             │
│                               ─────                              │
│                                                                  │
│ ┌─────────────────────────────────────────────────┬────────────┐ │
│ │ ✈️ Thai AirAsia                       15 Nov 2026 │ ROUTE      │ │
│ ├─────────────────────────────────────────────────┤            │ │
│ │ DEPARTURE                             ARRIVAL   │ DEL ✈️ DAD  │ │
│ │ 20:55             ✈️──●              09:05     │            │ │
│ │ DEL New Delhi    1 Stop         DAD Da Nang     │ 🧳 0 kg    │ │
│ │ Indira Gandhi Intl              Da Nang Intl    │ 💼 7 kg    │ │
│ │ 15 Nov 2026                     16 Nov 2026     │            │ │
│ ├─────────────────────────────────────────────────┴────────────┤ │
│ │ ⚠️ 4h 45m layover at Bangkok • Change of planes              │ │
│ └──────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

#### Detailed Element Specifications:
1. **Boarding Pass Container**:
   - White card with `border-radius: 14px`, `border: 1px solid #e2e8f0`, `box-shadow: 0 4px 12px rgba(0,0,0,0.04)`.
   - Layout split into **Main Flight Body (75%)** and **Ticket Stub (25%)**.
2. **Airline Header Band**:
   - Solid Deep Navy background (`#091c3e`) on top of card.
   - Left: Rounded pill tag in Trippy Red or Golden Yellow (`bg-red-600 text-white` or `bg-amber-400 text-slate-950 font-bold px-3 py-1 rounded-full text-xs`) displaying `✈ Airline Name`.
   - Right: Flight Departure Date in crisp white `font-semibold text-xs`.
3. **Flight Route & Times**:
   - **Departure Block**:
     - Sub-label: `DEPARTURE` in `text-[10px] font-bold tracking-wider text-slate-400 uppercase`.
     - Big Time: `20:55` in `text-3xl font-extrabold text-slate-900 font-mono`.
     - Airport Code: `DEL` in `text-base font-extrabold text-red-600`.
     - City & Airport: `New Delhi, Indira Gandhi International Airport`.
     - Date Stamp: `15 Nov 2026`.
   - **Flight Path Vector**:
     - Centered between departure and arrival.
     - Horizontal dashed line (`border-t-2 border-dashed border-slate-300`).
     - Centered plane icon `✈️` with stop pill badge (`Non-stop` in `bg-slate-100 text-slate-700` or `1 Stop` in `bg-amber-50 text-amber-800 border border-amber-200`).
   - **Arrival Block**:
     - Sub-label: `ARRIVAL` in `text-[10px] font-bold tracking-wider text-slate-400 uppercase`.
     - Big Time: `09:05` in `text-3xl font-extrabold text-slate-900 font-mono`.
     - Airport Code: `DAD` in `text-base font-extrabold text-blue-600`.
     - City & Airport: `Da Nang, Da Nang International Airport`.
     - Date Stamp: `16 Nov 2026`.
4. **Layover Notice Ribbon**:
   - Full-width subtle warm bar (`background: #fefce8; border-top: 1px solid #fef08a`).
   - Text: `4h 45m layover at Bangkok • Change of planes` in `text-xs font-semibold text-amber-900`.
5. **Perforated Ticket Stub (Right Section)**:
   - Separated by vertical dashed line (`border-l-2 border-dashed border-slate-300`).
   - **Physical Ticket Notches**: CSS pseudo-elements creating semi-circular cutouts at the top and bottom of the divider line (`w-4 h-4 rounded-full bg-slate-100`).
   - Sub-label: `ROUTE` in `text-[10px] font-bold tracking-wider text-slate-400 uppercase`.
   - Route display: `DEL ✈ DAD` in bold text.
   - Baggage icons:
     - Check-in luggage: `🧳 20 kg Check-in`
     - Cabin luggage: `💼 7 kg Cabin`

---

### 4.4 Page 4: Accommodations & Commercial Summary

**Visual Benchmark:** *Reference Page 4*
```
┌──────────────────────────────────────────────────────────────────┐
│                          Accommodations                          │
│                               ─────                              │
│                                                                  │
│ ┌──────────────────────────────────────────────────────────────┐ │
│ │ 🏨  Grand Gold Hotel                              [ 2 Nights ]│ │
│ │     Da Nang                                                  │ │
│ │ ──────────────────────────────────────────────────────────── │ │
│ │ Room: Deluxe Double or Twin Room with Partial Seaview        │ │
│ │ Check in: 19 Nov 2026          Check out: 21 Nov 2026        │ │
│ │ No. of Room: 1                 Meal: Breakfast Included      │ │
│ └──────────────────────────────────────────────────────────────┘ │
│                                                                  │
│                        Pricing & Payment                         │
│                               ─────                              │
│ ┌──────────────────────────────────────────────────────────────┐ │
│ │ 📍 LAND PACKAGE                  ✈️ FLIGHT COST              │ │
│ │   ₹ 76,500                         ₹ 97,000                  │ │
│ │ ──────────────────────────────────────────────────────────── │ │
│ │                     TOTAL PACKAGE VALUE                      │ │
│ │                         ₹ 1,73,500                           │ │
│ │                   Tax Included. ₹1,500 (TCS)                 │ │
│ └──────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

#### Detailed Element Specifications:
1. **Accommodation Card**:
   - Clean white card with `12px` rounded corners and `1px solid #e2e8f0`.
   - Header with Hotel building icon (`🏨`), Hotel name in `18px font-bold text-slate-900`, city in `13px text-slate-500`.
   - Right badge: Pill in Trippy Red or Amber Gold (`bg-amber-500 text-white font-bold px-3 py-1 rounded-full text-xs`) indicating `X Nights`.
   - Divider line and 2x2 details grid: Room category, check-in, check-out, meal plan.
2. **Pricing & Commercial Card**:
   - Luxurious Deep Navy container (`#091c3e`) with rounded corners.
   - **Sub-cost Split Cards**:
     - Land Package card: Dark translucent overlay (`rgba(255,255,255,0.06)`), gold pin icon `📍 LAND PACKAGE`, price in large white bold font.
     - Flight Cost card: Dark translucent overlay, plane icon `✈ FLIGHT COST`, flight cost in large white bold font.
   - **Total Package Value**:
     - Golden yellow label: `TOTAL PACKAGE VALUE` uppercase tracked.
     - Huge display font: `₹ 1,73,500` in white `text-3xl md:text-4xl font-black font-mono`.
     - Subtext: `Tax Included. 5% GST Included • ₹1,500 (TCS)`.

---

### 4.5 Pages 5 to N: Daily Experience Narrative & Photo Spreads

**Visual Benchmark:** *Reference Pages 5, 6, 7, 8, 9, 10*
```
┌──────────────────────────────────────────────────────────────────┐
│ [ Day 1 ]  Mon • Nov 16, 2026                            Da Nang │
│                                                                  │
│ Flight to Hanoi + Half Day City Tour - HANOI STAY                │
│                                                                  │
│ Arrive at Noi Bai International Airport, where you will be       │
│ greeted by your driver and transferred to your hotel...          │
│                                                                  │
│ Visit the famous Ho Chi Minh Mausoleum and nearby One Pillar     │
│ Pagoda, followed by the historic Temple of Literature...         │
│                                                                  │
│ [ 🛌 Stay: Da Nang ]  [ 🍽️ Breakfast ]                           │
│                                                                  │
│ ┌─────────────────────────────┐ ┌─────────────────────────────┐  │
│ │                             │ │                             │  │
│ │   [ PHOTO 1: Train Street ] │ │  [ PHOTO 2: Tran Quoc Pag ] │  │
│ │                             │ │                             │  │
│ └─────────────────────────────┘ └─────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

#### Detailed Element Specifications:
1. **Day Header Block**:
   - Day pill badge: Deep Navy pill (`bg-slate-900 text-white px-3 py-1 rounded-full text-xs font-bold`) showing `Day 1`.
   - Date display: `Mon • Nov 16, 2026` in `text-slate-500 font-semibold text-sm`.
   - Destination tag: Right-aligned destination name in Trippy Red or Warm Amber (`font-bold text-red-600 text-base`).
2. **Day Title**:
   - High-impact headline in Deep Navy (`#091c3e`), 18px font size, extra bold.
3. **Narrative Paragraphs**:
   - Generous line height (`1.6`), slate-700 text color, key landmark highlights in **bold**.
4. **Pill Tags Row**:
   - Stay tag: `🛌 Stay: Hotel / City Name` with outline border (`border border-amber-300 text-amber-900 bg-amber-50/50 rounded-full px-3 py-1 text-xs font-semibold`).
   - Meal tags: `🍽️ Breakfast`, `🍽️ Lunch`, `🍽️ Dinner` in clean pill badges.
5. **Two-Photo Symmetrical Grid**:
   - Side-by-side photo gallery (`grid grid-cols-2 gap-4 mt-4`).
   - Aspect ratio: `16:10` or `4:3`, with `10px` border radius, high-DPI rendering, and crisp border.
   - Pexels/Unsplash verified travel photography corresponding to that exact city/attraction.

---

### 4.6 Page N+1: Payment Options & Banking Details

**Visual Benchmark:** *Reference Page 11*
```
┌──────────────────────────────────────────────────────────────────┐
│                        Pricing & Payment                         │
│                               ─────                              │
│                                                                  │
│ [ Top Dark Navy Package Value Card ]                             │
│                                                                  │
│ ┌──────────────────────────────┐ ┌──────────────────────────────┐ │
│ │ INSTANT PAYMENT              │ │ BANK TRANSFER                │ │
│ │ 📱 Scan to Pay via UPI       │ │ 🏛️ NEFT / IMPS / RTGS         │ │
│ │ Open any UPI app to scan...  │ │ Transfer directly to bank... │ │
│ │                              │ │                              │ │
│ │    ┌──────────────────┐      │ │ 🏛️ BANK NAME                 │ │
│ │    │  [ UPI QR CODE ] │      │ │    HDFC Bank                 │ │
│ │    └──────────────────┘      │ │ 👤 ACCOUNT HOLDER            │ │
│ │   UPI ID:                    │ │    TrippyGo Holidays LLP     │ │
│ │   trippygo@okaxis            │ │ 💳 ACCOUNT NUMBER            │ │
│ │                              │ │    50200012345678            │ │
│ │                              │ │ 🔒 IFSC CODE                 │ │
│ │                              │ │    HDFC0000280               │ │
│ └──────────────────────────────┘ └──────────────────────────────┘ │
│                                                                  │
│ 🔒 Secure & Hassle-Free Payments: Encrypted & verified           │
│ ℹ️ Full payment or advance payment required to confirm booking    │
└──────────────────────────────────────────────────────────────────┘
```

#### Detailed Element Specifications:
1. **Instant Payment Card (Left Column)**:
   - Title: `INSTANT PAYMENT` in gold/red uppercase.
   - Subtitle: `Scan to Pay via UPI` with mobile phone icon.
   - Instruction: `Open any UPI app and scan the QR code to make the payment`.
   - **QR Code Container**:
     - Centered `140px x 140px` crisp QR code container with subtle border.
     - Dynamic UPI QR generated with standard string format: `upi://pay?pa=trippygo@okaxis&pn=TrippyGo%20Holidays&am={price}&cu=INR`.
     - UPI ID displayed in bold mono font below QR.
2. **Bank Transfer Card (Right Column)**:
   - Title: `BANK TRANSFER` in gold/red uppercase.
   - Subtitle: `NEFT / IMPS / RTGS`.
   - Bank information rows with circular icon badges:
     - Bank Name (e.g. HDFC Bank / ICICI Bank)
     - Account Holder Name (TrippyGo Holidays / Friends Travel)
     - Account Number
     - IFSC Code
3. **Trust & Security Alerts (Bottom)**:
   - Gold alert: Lock icon with `Secure & Hassle-Free Payments - Your payment information is safe with us.`
   - Blue alert: Info icon with `Note: Advance token payment is required to confirm flight and hotel blocks.`

---

### 4.7 Page N+2: Inclusions, Exclusions & Notes

**Visual Benchmark:** *Reference Pages 12, 13, 14*
```
┌──────────────────────────────────────────────────────────────────┐
│                            Inclusions                            │
│                               ─────                              │
│ ┌──────────────────────────────────────────────────────────────┐ │
│ │ • Accommodation in Double/Twin share room with daily b/f     │ │
│ │ • Sightseeing tickets, transfers, and services as mentioned  │ │
│ │ • English-speaking tour guide during tours                   │ │
│ │ • All airport transfers via private A/C vehicle              │ │
│ │ • Entrance tickets & Ha Long Bay cruise day tour with lunch  │ │
│ └──────────────────────────────────────────────────────────────┘ │
│                                                                  │
│                            Exclusions                            │
│                               ─────                              │
│ ┌──────────────────────────────────────────────────────────────┐ │
│ │ • Visa fees & processing charges                             │ │
│ │ • International / domestic flight tickets unless specified   │ │
│ │ • TCS charges (collected as per Government regulations)       │ │
│ │ • Personal expenses (laundry, telephone, alcoholic drinks)   │ │
│ └──────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

#### Detailed Element Specifications:
- Centered section titles with Trippy Red accent bar.
- Generous white card container with rounded borders (`12px`) and subtle shadow.
- Large clear bullet points with comfortable reading line-height (`1.6`).
- Dedicated **Notes Card** covering passport validity (minimum 6 months), visa documentation rules, and agency advisory.

---

### 4.8 Page N+3: Terms, Conditions & Cancellation Policy

**Visual Benchmark:** *Reference Pages 15, 16*
```
┌──────────────────────────────────────────────────────────────────┐
│                        Terms & Conditions                        │
│                               ─────                              │
│ ┌──────────────────────────────────────────────────────────────┐ │
│ │ Payment Structure:                                           │ │
│ │ • Token Amount: Starting from INR 10,000 non-refundable      │ │
│ │ • Booking Advance: 30% of package + 100% flight & visa cost  │ │
│ │ • Balance Payment: Remaining to be paid 30 days prior        │ │
│ │                                                              │ │
│ │ Cancellation Policy – Time Slabs:                            │ │
│ │ • 30+ days before departure: 25% of the tour cost            │ │
│ │ • 30–15 days before departure: 50% of the tour cost          │ │
│ │ • 15–7 days before departure: 75% of the tour cost           │ │
│ │ • Less than 7 days / No Show: 100% of the tour cost          │ │
│ └──────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

---

### 4.9 Page N+4: The Branded Back Cover & Social Proof

**Visual Benchmark:** *Reference Page 17*
```
┌──────────────────────────────────────────────────────────────────┐
│ (TG Logo)                                                ✈️ ─ ─ │
│ Thank you                                                        │
│ for choosing                                                     │
│ TrippyGo                                                         │
│ ────────────────                                ┌──────┐ ┌──────┐│
│                                                 │PHOTO1│ │PHOTO2││
│ 🌐 We believe every unforgettable journey begins│├──────┤ ├──────┤│
│    long before departure...                     │PHOTO3│ │PHOTO4││
│ 👥 With over 8 years of experience, we have     ├──────┤ ├──────┤│
│    crafted personalized holidays for 100k+...   │PHOTO5│ │PHOTO6││
│ 🧳 We take care of everything from flights to   └──────┘ └──────┘│
│    stays so you can travel stress-free...                        │
│ ───────────────────────────────────────────────                  │
│ ┌──────────────────────────────────────────────┐ 🏆 AWARDED      │
│ │ For journeys you'll always remember.  (Photo)│    Best Intl... │
│ └──────────────────────────────────────────────┘ ⭐️ 4.7/5  250k+ │
│                                                                  │
│ ┌──────────────────────────────────────────────────────────────┐ │
│ │  🛡️ Trusted    🎧 24/7 Support  🌟 Hassle-Free  🔒 Safe & Sec│ │
│ └──────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ 📞 +91-9871597736   ✉️ info@trippygo.in   🌐 www.trippygo.in   ✈️ │
└──────────────────────────────────────────────────────────────────┘
```

#### Detailed Element Specifications:
1. **Left Brand Column**:
   - TrippyGo Logo with dotted curved flight path leading to an ascending airplane.
   - Script font: *"Thank you"* in Trippy Red or Warm Amber (`font-cursive text-4xl`).
   - Bold sans font: *"for choosing"* in Deep Navy (`font-black text-3xl uppercase tracking-tight`).
   - Bold sans font: *"TrippyGo"* in Trippy Red (`font-black text-4xl uppercase tracking-wide`).
   - Four core values with circular icon bullets (Globe, Group, Suitcase, Heart).
   - Navy mini-card: *"For journeys you'll always remember"* with traveler photo cutout.
2. **Right Traveler Photo Mosaic**:
   - `2 x 3` grid of 6 rounded, colorful traveler photos showing genuine joyful vacation moments (island beaches, jungle swings, scenic temples, city skylines).
   - Below photo mosaic:
     - Golden Award Box: Trophy icon + *"AWARDED: The Best International Holiday Brand in India"*.
     - Social Proof Badges: Google Reviews (`4.7/5 ⭐⭐⭐⭐⭐ 2000+ reviews`) + Instagram (`250k+ Followers`).
3. **Bottom Floating Trust Pillars Card**:
   - White rounded card with 5 distinct icons and descriptions:
     1. `🛡️ Trusted by 100k+ travellers from across the world`
     2. `🎧 24/7 Support - We're here whenever you need us`
     3. `🌟 Hassle-free Holidays - End-to-end planning with care`
     4. `🔒 Safe & Secure - Your data and journey are always protected`
     5. `❤️ Personalized for You - Trips designed just for you`
4. **Full-Bleed Contact Banner**:
   - Solid Deep Navy footer bar with golden top border and curved edge accents.
   - Branded contact channels: Phone, Email, Official Website.
   - Playful dotted flight trail with airplane taking off on the bottom right corner.

---

## 5. Print & PDF Engine Technical Specifications

To ensure the template renders identically in web preview mode and Playwright headless Chromium PDF generation, the following CSS and rendering principles must be adhered to:

### 5.1 A4 Paper Sizing & Margins
- **Dimensions**: Standard A4 Portrait = `210mm` width × `297mm` height.
- **DPI Standards**:
  - Web preview: 96 DPI (`794px` × `1123px` per page).
  - High-resolution print rasterizer: 300 DPI (`2480px` × `3508px`).
- **Page Break Rules**:
  ```css
  @media print {
    @page {
      size: A4 portrait;
      margin: 0; /* Full bleed capability for cover and back page */
    }

    body {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      background-color: #ffffff;
      margin: 0;
      padding: 0;
    }

    .page-break {
      break-after: page !important;
      page-break-after: always !important;
    }

    .avoid-break {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }
  }
  ```

### 5.2 Multi-Page Flow Management
Each distinct section is assigned its own discrete A4 page wrapper:
1. `.print-page-cover`: 100% viewport height, full-bleed hero.
2. `.print-page-summary`: Trip overview table + footer.
3. `.print-page-flights`: Flight cards + baggage + footer.
4. `.print-page-stays`: Hotel vouchers + pricing summary card + footer.
5. `.print-page-day`: One to two days per page with symmetrical photo pairs.
6. `.print-page-payment`: Payment options + bank wire details + footer.
7. `.print-page-terms`: Inclusions, exclusions, booking policies + footer.
8. `.print-page-back`: Photo mosaic + trust badges + full-bleed contact footer.

### 5.3 Font & Image Readiness Detection
To eliminate partial renders, blank images, or font flash in Playwright:
```javascript
// Dispatched on document complete:
Promise.all([
  document.fonts.ready,
  Promise.all(
    Array.from(document.images).map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise((res) => {
            img.onload = res;
            img.onerror = res;
          })
    )
  ),
]).then(() => {
  document.querySelector('meta[name="ready"]')?.setAttribute("content", "true");
  document.documentElement.classList.add("rendered-ready");
});
```

---

## 6. Implementation Plan & Migration Steps

To upgrade the current itinerary template to this benchmark standard:

| Step | Action Item | Target File(s) |
| :--- | :--- | :--- |
| **1** | Copy TrippyGo brand logo to `public/brand/` for reliable static serving in print | `public/brand/trippygo-logo.png` |
| **2** | Update `src/styles/print.css` with A4 page sizing, notch shapes, and print tokens | `src/styles/print.css` |
| **3** | Create dedicated `FlightCard.tsx` component (boarding pass styling with ticket notches) | `src/templates/itinerary/FlightCard.tsx` |
| **4** | Redesign `CoverPage.tsx` with full-bleed hero, TrippyGo logo badge, and client card | `src/templates/itinerary/CoverPage.tsx` |
| **5** | Redesign `TripGlance.tsx` into the benchmark `Trip Summary` table | `src/templates/itinerary/TripGlance.tsx` |
| **6** | Redesign `StaysTable.tsx` to match the hotel voucher card design | `src/templates/itinerary/StaysTable.tsx` |
| **7** | Create `PaymentPage.tsx` with UPI QR code generator and bank transfer card | `src/templates/itinerary/PaymentPage.tsx` |
| **8** | Redesign `DayBlock.tsx` with badge pills and two-photo grid spreads | `src/templates/itinerary/DayBlock.tsx` |
| **9** | Redesign `BackPage.tsx` with traveler mosaic, trust pillars, and branded footer | `src/templates/itinerary/BackPage.tsx` |
| **10**| Update `ItineraryTemplate.tsx` page flow and run end-to-end PDF render tests | `src/templates/itinerary/ItineraryTemplate.tsx` |

---

*Document finalized & aligned with TrippyGo Brand Standards and Vietnam Itinerary Benchmark.*
