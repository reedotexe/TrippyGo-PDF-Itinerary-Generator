# TrippyGo Itinerary PDF Software: Ideation Document

Oct 23, 2026 · @Coffee

## Overview

The tool lets a salesperson turn a supplier itinerary (PDF or pasted text) into a finished, TrippyGo-branded PDF in a few minutes, with their own selling price and the client's travel dates already applied. It replaces retyping itineraries into a design file by hand.

**Who uses it.** The agency's sales team builds and sends itineraries. An admin keeps the brand template, default terms, image preferences and markup defaults.

**The problem.** Suppliers send itineraries in many shapes and with their own pricing. Staff reformat them, add the agency's markup, change dates for each client and hunt for photos. Typical Indian package itineraries all carry the same blocks (day-wise plan, inclusions, exclusions, payment terms and a cancellation schedule), so most of that work is repeatable.

**Proposed success criteria** (targets to confirm with the agency, not measured figures):

- A first client-ready PDF within about 5 minutes of upload, including review.
- Every edit made in a form, with no design tool and no PDF editing.
- The supplier's net price and the markup never appear in the client PDF.
- Changing the trip start date re-labels every day and every date mention in one step.
- The same itinerary re-renders identically each time, so a corrected PDF looks like the original.

## Locked decisions

Four choices are fixed; the fifth (pricing and dates) was left to this document and is proposed in the pricing and dates sections below.

| # | Area | Choice | What it implies |
| --- | --- | --- | --- |
| 1 | Rendering | HTML/CSS template rendered by Playwright | The TrippyGo theme becomes web code. Needs headless Chromium in Docker, bundled fonts and a print stylesheet. |
| 2 | Input | LLM-based extraction from PDF or text | Schema-enforced JSON output plus a human review screen. Each upload costs one or a few model calls. |
| 3 | Editing | Form-based editor | The editor changes JSON fields, never the PDF. A live HTML preview sits beside the form. |
| 4 | Images | Unsplash and Pexels only, for now | Attribution, hotlinking and download-tracking rules apply (see the images section). No private photo library in v1. |
| 5 | Pricing and dates | Designer's choice | Proposed: net price and markup stored as data, selling price computed, dates stored as a start date plus day offsets. |

## End-to-end workflow

&#91;embedded content: upload to PDF workflow, 9 steps, 1 decision\]

Every upload passes through a person: the model proposes, the salesperson confirms images, markup and dates, and only then does the server render a PDF and save it as a new version. If extraction fails twice, the same form opens blank with the source file beside it, so work never stops on the model.

## Itinerary data model

One JSON document describes the whole itinerary, and everything else (extraction, form, preview, PDF) reads or writes it. The block list below follows what Indian package itineraries already contain: a day-wise plan, inclusions, exclusions, payment terms and a cancellation schedule, as seen in [Veena World package pages](https://www.veenaworld.com/package/jaipur-ranthambore-tour-package-shrj26/i) and [agency itinerary PDFs](https://engage.onlinejain.com/media/event/Uttarakhand_Immersion_Program_2025_Engage.pdf).

```json
{
  "schemaVersion": 1,
  "package": {
    "title": "Kashmir Escape",
    "destinations": ["Srinagar", "Gulmarg", "Pahalgam"],
    "nights": 6, "days": 7,
    "startDate": "2026-12-10",
    "travellers": { "adults": 2, "children": 0, "rooms": 1 }
  },
  "days": [
    {
      "dayNumber": 1,
      "title": "Arrival in Srinagar",
      "description": "...",
      "activities": ["Shikara ride", "Mughal gardens"],
      "meals": ["Dinner"],
      "stay": { "hotel": "...", "city": "Srinagar" },
      "imageQuery": "Dal Lake Srinagar",
      "image": { "provider": "unsplash", "photoId": "...", "credit": "..." }
    }
  ],
  "inclusions": ["..."],
  "exclusions": ["..."],
  "pricing": {
    "currency": "INR", "basis": "per_person",
    "netAmount": 0,
    "markup": { "type": "percent", "value": 0 }
  },
  "terms": { "payment": ["..."], "cancellation": [ { "window": "...", "charge": "..." } ] },
  "meta": { "sourceFile": "...", "extractedBy": "...", "reviewFlags": [] }
}
```

Design rules:

- **Inputs are stored, outputs are computed.** The selling price, the day dates and the weekday labels are calculated at render time from `netAmount`, `markup` and `startDate`, so they can never disagree with each other.
- **Dates are offsets, not text.** Each day has a `dayNumber`; the calendar date for day N is `startDate` plus N minus 1.
- **Terms are structured.** Cancellation is a list of window and charge pairs, so the template can draw it as a table and the editor can edit it row by row.
- **Provenance lives in `meta`.** `reviewFlags` marks fields the model was unsure about, so the review screen can highlight them.
- **Versioned.** Every saved edit keeps the previous JSON, and each generated PDF stores the hash of the JSON it came from, so any sent PDF can be reproduced.

## LLM extraction pipeline

Extraction is one model call that reads the uploaded PDF or pasted text and returns the itinerary JSON, followed by code-side validation and a mandatory human review. The model never writes the final PDF.

1. **Send the source as-is.** Claude reads a PDF as both extracted text and page images, which helps with tables and scanned pages (see [PDF support overview](https://www.promptlayer.com/glossary/claude-pdf-support)). Third-party summaries report a 32 MB request limit and full visual analysis up to 100 pages ([source](https://fast.io/resources/claude-pdf-limit/)); itineraries are far smaller, but confirm current limits in Anthropic's docs.
2. **Force the schema.** Structured outputs are generally available on the Claude API and guarantee valid JSON that matches your schema ([docs](https://platform.claude.com/docs/es/build-with-claude/structured-outputs)). Define the schema once in code (Zod in TypeScript) and generate the JSON Schema from it, so the same definition validates the model output, the form and the template.
3. **Prompt for fidelity, not creativity.** Instructions: copy only what the source states; use null for anything missing; never invent prices, hotels or dates; keep the supplier's activity wording; and add one `imageQuery` per day (place name plus a visual keyword) so image search needs no second model call.
4. **Validate in code.** Check that the day count matches nights plus one, that day numbers are sequential, that the price parses to a number, and that required blocks exist. Anything that fails becomes a `reviewFlag` instead of an error, so the salesperson can fix it.
5. **Review screen.** The form opens with flagged fields highlighted. A schema-guided pass with validation is the pattern that held up in practice for larger extraction jobs, where dumping whole documents into a model and hoping for clean output did not ([write-up](https://dev.to/__c1b9e06dc90a7e0a676b/i-spent-a-month-fighting-llms-to-extract-structured-data-19gp)).

**Cases to design for:**

- **Several options in one source.** Some agency quotes list Option 1, Option 2 with different hotels, as in this [quote PDF](<https://naac.santosh.ac.in/assets/pdf/quote-17740023%20(1).pdf>). The schema needs a `variants` list, or the review screen asks the salesperson to pick one.
- **Price tables by room or group size.** Extract the table as rows and let the salesperson choose the row that becomes the net price.
- **Scanned or photographed PDFs.** The image path handles these, but flag low confidence and let the salesperson retype.
- **Pasted text with no structure.** Works through the same call.
- **Hard failure.** If extraction fails twice, open a blank itinerary form with the source file shown beside it.

**Cost and model choice.** Each upload is one call. Start with a current Sonnet-class model (the API string `claude-sonnet-5-5` at the time of writing; confirm in the Claude Console), and try a smaller model only after a test set shows no accuracy loss.

**Test set.** Collect around 20 real supplier itineraries from the agency before building, and score extraction on day count, price, hotel names and cancellation rows. This number is a proposal, not a benchmark.

## Form-based editor and live preview

The editor is a two-pane screen: a form on the left that edits the itinerary JSON, and a live page-by-page preview on the right that is the exact HTML the PDF will be printed from. Because both use one template, what the salesperson sees is what the client gets.

| Panel | Fields | Notes |
| --- | --- | --- |
| Basics | Title, destinations, nights, start date, travellers, rooms | Changing the start date updates every day's date label. |
| Days | Per day: title, description, activities, meals, stay, image | Drag to reorder, duplicate a day, add or remove activities. Day numbers renumber automatically. |
| Inclusions and exclusions | Repeatable text rows | Each list can be hidden from the PDF with a toggle. |
| Pricing | Net price, markup type and value, per person or total | Shows the computed selling price and margin to staff only. |
| Terms | Payment rows, cancellation window and charge rows | Starts from the agency's default terms when the source has none. |
| Contact | Agent name, phone, email, validity date | Prefilled from the logged-in salesperson. |

**Behaviors that make it fast:**

- Autosave on every change, with undo and a per-field reset to the extracted value.
- Fields the model was unsure about are highlighted until the salesperson touches them.
- Preview refreshes after a short pause in typing, not on every key.
- An image picker opens from any day; it searches Unsplash and Pexels, shows thumbnails and fills the credit line automatically.
- A Generate button renders the PDF on the server, saves it as a new version of the itinerary and offers download. Earlier versions stay listed so a sent file can be reopened.

**What editing does not include.** Layout, fonts and colors belong to the TrippyGo template, so the editor changes content only: text, images, numbers, dates and which sections appear. That keeps every PDF on-brand and keeps the form simple.

## TrippyGo template and PDF design

The template should lead with photography and keep the itinerary itself easy to scan. Print-production guidance for travel brochures says to sell the place through imagery first, limit the type to two font families, keep copy short, and end with a clear next step such as contact details or a QR code ([4over4 guidance](https://www.4over4.com/faqs/brochures/what-are-the-best-practices-for-travel-brochure-printing-inspiration)). Another design guide calls itinerary clarity the brochure's core functional job ([guide](https://madegooddesigns.com/?p=5782)).

**The TrippyGo brand files have not been seen yet.** The page plan below is a proposal for an A4 portrait document; colors, fonts and logo come from the agency's brand assets.

| Page | Content |
| --- | --- |
| Cover | Full-bleed hero photo, package title, duration (for example 6 nights, 7 days), destinations, "prepared for" name and date. |
| Trip at a glance | Route, travel dates, travellers, top highlights and the selling price box. |
| Day by day | One day card per day with photo, title, description, activities, meals and stay. One or two cards per page. |
| Stays | A table of hotels by city and nights. |
| Inclusions and exclusions | Two columns, each hideable. |
| Pricing and payment | Selling price, what it is based on, payment steps and validity date. |
| Cancellation and terms | Cancellation table and standard terms. |
| Back page | Agency contact, QR code or link, GST and registration details if required. |

**Print rules that prevent ugly PDFs** (Chromium, through Playwright):

- Declare the paper size with CSS `@page` and pass `preferCSSPageSize`, so the stylesheet controls size ([guide](https://macmyths.com/tips-for-generating-pdfs-with-puppeteer/)). CSS variables do not work inside `@page` rules.
- Turn on `printBackground` and set exact print color adjustment, or background colors and images drop out.
- Wait until fonts and images have loaded before printing. Without that, the PDF can fall back to system fonts ([reference](https://slicker.me/css/print-pdf.html)). Bundle the brand fonts inside the project instead of loading them from the network.
- Keep each day card together with `break-inside: avoid`, and use fragmentation breaks sparingly ([guide](https://htmlcsstoimage.com/blog/optimize-html-for-pdf-printing)). Table headers repeat on a new page automatically.
- Use the page-number footer through Playwright's header and footer templates, not CSS counters in the body.
- Request right-sized images (see the images section) so a 10-day itinerary stays small enough to email.

**Fixtures to test the template against:** a 3-day, a 7-day and a 14-day itinerary; a day with no image; very long hotel and activity names; a package with no cancellation block; and an itinerary where price is missing. Render all of them on every template change and compare the PDFs by eye.

## Images via Unsplash and Pexels

Each day's `imageQuery` is searched on both providers at once, the results go into a picker, and the salesperson confirms one photo per day. Both APIs are free but come with rules that shape the design, so the rules come first.

| Rule | Unsplash | Pexels |
| --- | --- | --- |
| Default rate limit | 50 requests per hour in demo mode, 1,000 per hour after production approval ([docs](https://unsplash.com/documentation)) | 200 per hour and 20,000 per month; higher limits on request with a demo showing attribution ([docs](https://www.pexels.com/api/documentation/)) |
| Auth | `Authorization: Client-ID <key>` | `Authorization: <key>` |
| Hotlinking | Required: use the image URLs the API returns; keep the `ixid` parameter when resizing | Not stated as a requirement |
| Attribution | Credit photographer and Unsplash, with links | Prominent link to Pexels; credit the photographer where possible |
| Download tracking | Call the download endpoint when your app downloads a photo | None |
| Useful search filters | `orientation`, `per_page` (max 30), `content_filter` | `orientation`, `size`, `per_page` (max 80), `locale` |
| Sizing | `urls.raw` plus `w`, `q`, `fm`, `dpr` parameters | Ready-made `src.landscape` (1200 by 627) and `src.large2x` |

One figure conflicts across sources: some third-party guides say Unsplash production approval gives 5,000 requests per hour, while Unsplash's own documentation says 1,000. Treat the official figure as the plan and check the app dashboard after approval.

**How the rules shape the build**

- **Store references, not files.** Save provider, photo ID and the credit text in the itinerary JSON, and build the image URL at render time. Playwright then loads the image from the provider's CDN, which satisfies hotlinking. Do not copy photos into the agency's own storage.
- **Fire the Unsplash download event when a photo is chosen** for an itinerary, because that is the moment the app commits to using it. A connector that only searches does not do this for you ([note](https://agentman.ai/agentskills/connections/mcp-server/unsplash)); the app must call `download_location` itself.
- **Credit photos inside the PDF.** Add a small photo-credits block on the back page listing photographer and provider per image, with the links the guidelines ask for. Confirm the exact wording on Unsplash's attribution guideline and Pexels' guidelines before launch; this document used the API overviews, not the full guideline pages.
- **Keep the API key on the server.** The browser asks the app's own endpoint, which calls the providers. This also lets the app cache search results briefly to save quota.
- **Request sized images.** Unsplash `urls.regular` is 1080 pixels wide; Pexels `landscape` is 1200 by 627. Use a larger size only for the cover.

**Matching logic**

1. Search `imageQuery` on both providers with landscape orientation.
2. Interleave the top results and show about six thumbnails with alt text and, where Unsplash gives one, the location.
3. Pre-select the first result whose location or alt text mentions the destination; the salesperson can change it.
4. If nothing fits, retry with the destination name alone, then with a generic travel query, then leave the slot empty and let the template drop the image cleanly.

**Risks.** Stock libraries do not cover every Indian town, and a wrong photo (a lake from another country labeled as the destination) misleads a client. That is why the picker is a required step and not silent automation. Photos of identifiable people can also need model releases for commercial use ([guidance](https://blog.openreplay.com/free-stock-photo-resources/)), so prefer landscapes and landmarks in queries.

**Quota per itinerary.** A 7-day itinerary needs 7 searches on each provider, plus up to 7 Unsplash download events, which are also API calls.

| Provider | Calls per 7-day itinerary | Itineraries per hour at the stated limit |
| --- | --- | --- |
| Unsplash, demo mode | up to 14 (7 searches, 7 download events) | about 3 |
| Unsplash, production | up to 14 | about 70 |
| Pexels, default | 7 | about 28 |

The design is therefore fine at the agency's likely volume once Unsplash production access is approved; apply for it early, because approval depends on following the guidelines.

## Markup pricing design

The supplier's net price and the agency's markup are stored as inputs; the client-facing selling price is always calculated from them, and the client PDF never receives the net price or the markup.

**Formulas**

```latex
\text{markup} = \begin{cases} \text{net} \times p / 100 & \text{percent markup} \\ v & \text{flat markup} \end{cases}
\text{selling price} = \text{net} + \text{markup}
\text{margin \%} = \frac{\text{markup}}{\text{selling price}} \times 100
```

A percent markup is taken on cost, so 15 percent markup is a smaller margin on the selling price. The form should show both numbers to staff to avoid confusion. Worked illustration: net 40,000 rupees with a 15 percent markup gives a markup of 6,000, a selling price of 46,000 and a margin of about 13.0 percent.

**Rules**

- **Whole-rupee integers.** Store money as integer paise (or use a decimal library), never floating point, and round once, at the end.
- **Rounding setting.** Default to the nearest rupee, with an optional setting to round up to the nearest 50 or 100 for cleaner quotes.
- **Indian number format.** Print amounts with Indian digit grouping (for example 1,25,000) using `Intl.NumberFormat` with the `en-IN` locale.
- **Basis.** A field for per person, per room or total, printed next to the price ("per person on twin sharing"). Child and infant pricing are open questions.
- **Defaults and overrides.** The admin sets a default markup (percent or flat); a salesperson can override it per itinerary. A configurable minimum margin shows a warning, not a block.
- **Audit trail.** Every change to net price or markup is saved in the itinerary's version history with the user and time.
- **Leak-proofing.** The server builds a separate client view of the itinerary with no `netAmount` and no `markup`, and both the right-hand preview and the PDF render from that view. Only the left-hand form shows the staff-only numbers.

**Tax display**

Indian tax treatment changes what price the client should see, so make it a setting rather than hard-coding one answer. Current guidance from tax sites says a tour operator selling a package as principal can charge 5 percent GST on the gross amount without input tax credit, or choose 18 percent with credit ([overview](https://taxgarden.in/blog/gst-on-domestic-tour-packages-india-2026)). The same sources say agent commission or service fees attract 18 percent, and overseas packages carry an additional 2 percent TCS ([billing guide](https://tripdesq.com/resources/gst-invoicing-for-travel-agencies)). Sources disagree on the SAC code, and rules change, so the agency's accountant should confirm which scheme applies. This is information to plan around, not tax advice.

| Setting | Options | Effect on the PDF |
| --- | --- | --- |
| GST mode | Inclusive, extra, hidden | Inclusive prints one price; extra prints price plus GST; hidden prints no tax line. |
| GST rate | Default 5 percent, editable | Applied to the selling price. |
| Supplier price includes GST | Yes or no | Open question: decides whether markup is added before or after tax. |
| TCS note | On or off | Adds a line for overseas packages. |

## Date customization design

The itinerary stores one start date and a day number per day; every visible date (day headers, trip end, weekday names) is computed from those two values at render time. Changing the start date therefore re-dates the whole PDF in one step.

**Model.** `startDate` is a plain calendar date (YYYY-MM-DD) with no time of day. Day N falls on the start date plus N minus 1 days, and the trip ends on the start date plus the number of nights. Do the arithmetic on calendar dates in UTC, or with a date library, and format with `Intl.DateTimeFormat` in the `en-IN` locale. Mixing local-time getters with date strings is the classic way to print the day before.

**What the editor offers**

- A date picker for the start date, with the end date shown as read-only text.
- A "dates not confirmed" switch that prints "Day 1, Day 2" with no calendar dates, for early-stage quotes.
- A change to the number of nights adds blank days at the end or asks before removing the last days.
- A quote-validity date, defaulting to a set number of days from today (a setting; the right value is an open question for the agency).

**Cleaning the source dates.** Supplier itineraries often have real dates baked in, such as a line headed "Day 1 - 7th Oct" in this [sample tour itinerary](https://sbgskolkata.ac.in/sites/subgs/files/2025-07/Notice%20No%2042%20%20-%20TOUR%20ITINERARY.pdf). The extraction prompt should therefore drop literal dates from day titles, use the first one to prefill `startDate`, and flag any remaining weekday or date words inside descriptions (for example "Sunday market") for review, because those can become wrong after a date change.

**Validation rules**

| Check | Result |
| --- | --- |
| Start date in the past | Warning |
| Quote validity before today | Warning |
| Start date later than the supplier's stated rate validity | Warning, using the validity date if the source has one (some packages state a last travel date) |
| Number of day cards differs from nights plus one | Review flag |
| Date text left inside a description | Review flag |

Edge cases to test: a year rollover (30 December start), a leap day, and a 1-night trip. India has no daylight saving, so time zones are only a risk if the server's own clock is used, which is why "today" should be computed in the Asia/Kolkata zone.

## Competitor landscape and differentiators

Existing itinerary tools are full builders where the agent assembles the trip inside the product; this tool starts from an itinerary someone else already wrote and focuses on branded output. That is the gap it fills, not a reason to copy the builders.

| Product | What it offers | Takeaway |
| --- | --- | --- |
| [TripMapper](https://www.getapp.co.uk/software/2083955/tripmapper) | Drag-and-drop day-by-day builder, cloneable templates, branded proposals shared as a web link or PDF | Cloning a past itinerary and a shareable web link are worth adding later. |
| [Safari Portal](https://g2.com/products/safari-portal/reviews?page=6) | Interactive digital itineraries plus print-friendly PDF or Word proposals | Offers PDF and Word output, confirming agencies still need a printable file. |
| [Tourwriter](https://us.fitgap.com/products/tourwriter) | Builder with supplier rates, margin calculations and proposal documents; Starter plan listed at 149 US dollars per month | Margin handling is a standard feature; the price shows why a custom tool can pay off. |
| [Ratiba](https://sourceforge.net/software/product/Ratiba/) | Cost-plus pricing engine, branded web proposals with comments and PDF export; starting price listed at 49 US dollars | Clients commenting on a proposal is a possible later feature. |
| [TripCreator](https://tripcreator.com/features/itinerary-builder) | Live cost, markup and margin per line; reusable trip templates | Same cost-versus-customer-price split as proposed here. |
| [TourSoft](https://www.getapp.co.uk/software/2080582/toursoft) | Itinerary and quotation builder with multiple currencies | A reviewer there asked for a PDF option and more templates, so branded PDF output is a real need. |
| [TravelTriangle quote PDF](<https://naac.santosh.ac.in/assets/pdf/quote-17740023%20(1).pdf>) | A fixed-layout quote PDF with price, inclusions, day plan and terms | A reference for what Indian customers already receive. |

**Where this tool can differ**

- **Import first.** Upload a supplier PDF or paste text and get a branded document. The pages reviewed describe building itineraries inside the product and did not mention importing someone else's PDF.
- **The agency's own look.** One TrippyGo template instead of generic themes.
- **Net price stays internal.** Markup is a first-class field with a margin readout for staff and a client view that never contains it.
- **Low running cost.** Running costs are Playwright hosting, image API keys and model calls, instead of a monthly seat fee.

Competitor pricing and features come from third-party directory pages and may be out of date.

## Tech stack, hosting and deployment

Use the stack you already ship with (TypeScript and React), keep Playwright in its own container, and put every secret on the server. The table is a proposal; swap any row for a tool you prefer.

| Layer | Proposed choice | Reason |
| --- | --- | --- |
| Web app | Next.js with React and TypeScript | One codebase for the form, the preview and the print route. |
| Schema | Zod, with JSON Schema generated from it | One definition validates model output, the form and the template. |
| Database | Postgres | Itineraries as JSON columns plus a version table. |
| Auth | The same login as the leads tracker | Salespeople use both tools. |
| Rendering | Playwright with Chromium, in its own Docker service | Browser memory and crashes stay away from the web app. |
| Extraction | Claude API with structured outputs | See the extraction section. |
| Images | Unsplash and Pexels, called from server routes | Keeps API keys private and allows short caching. |
| File storage | S3-compatible object storage for PDFs | Generated PDFs are saved per version. |

**Rendering service**

- Run Playwright inside Docker. Running it there is described as the standard production pattern in 2026, and Microsoft publishes official images with the browsers and system libraries included ([overview](https://bug0.com/knowledge-base/playwright-docker)). A plain Node image fails with missing-library errors ([Railway guide](https://docs.railway.com/guides/playwright.md)).
- Budget memory generously. One source puts a single idle container at roughly 500 MB to 1 GB ([source](https://bug0.com/knowledge-base/playwright-docker)); a small Playwright PDF service reports 400 to 800 MB per instance ([example](https://github.com/formester/pdfester)).
- Reuse one browser process, open an isolated context per render, and bound concurrency with a queue so a burst of requests cannot exhaust memory. A rendering service built this way uses a fresh context per job, closes it afterwards and caps parallel jobs ([example](https://glama.ai/mcp/servers/504532934/DocumentKit/tree)).
- Give the container a larger shared-memory size than Docker's 64 MB default (for example `--shm-size=1gb`), or Chromium can crash under load ([note](https://github.com/feder-cr/invisible_playwright/wiki/how-to-run-playwright-docker-undetected)).
- Install the brand fonts in the image and add extra system fonts if non-Latin scripts will ever appear.

**How a render runs**

1. The app saves the itinerary version and creates a render job.
2. The worker opens a protected print route for that version, using a short-lived token, and waits for a ready flag that the page sets once fonts and images have loaded.
3. Playwright prints the page to PDF with the CSS page size and backgrounds on.
4. The PDF is stored, linked to the version and offered for download.

**Safety.** The print page only loads images from the two allowed image hosts, and the container should refuse requests to private network addresses, as self-hosted PDF services do by default ([Gotenberg setup example](https://railway.com/deploy/gotenberg-pdf.md)). Keep API keys in environment variables, rate-limit the generate endpoint, and cap upload size and type.

**Fallback.** If running Chromium yourself becomes a burden, Gotenberg offers the same Chromium rendering behind a simple HTTP API ([guide](https://computingforgeeks.com/gotenberg-html-to-pdf-api/)); the HTML template would not change.

## Risks, edge cases and open questions

The two risks that could hurt the agency most are a wrong price reaching a client and the net price or the supplier's identity leaking into a client PDF; both are handled by design rather than by care.

| Risk | Mitigation |
| --- | --- |
| Extraction misreads a price, day or hotel | Schema validation, review flags, a mandatory review screen, and a test set of real itineraries. |
| Supplier name, logo or contact details reach the client PDF | The extraction prompt drops supplier branding and contacts, and the review screen flags any phone number, email or company name found in the text. |
| Net price or markup appears in the client PDF | Client view built on the server without those fields, plus an automated test that searches the PDF text for the net amount. |
| A stock photo shows the wrong place | Required picker with alt text and location shown; salesperson confirms each image. |
| Unsplash demo quota is too low | Apply for production access early; cache search results briefly. |
| Image attribution or download-tracking rules missed | Credits block in the PDF, download event on photo choice, and a read of both guideline pages before launch. |
| Layout breaks on unusual itineraries | Fixture set (short, long, missing image, long names), with PDFs compared on every template change. |
| Chromium memory use or crashes | Separate container, one browser with isolated contexts, bounded queue, larger shared memory. |
| Wrong tax treatment on the price | GST mode as a setting, confirmed by the agency's accountant. |
| Supplier documents sent to a model API | Agree with the agency that supplier itineraries may be processed this way, and check the provider's data-handling terms before launch. |

**Open questions for the agency**

- [ ] Can we get the TrippyGo template files, logo, fonts and colors?
- [ ] Do itineraries come from one supplier or many, and can we have about 20 real samples?
- [ ] Is pricing per person, per room or per group, and how are children and infants priced?
- [ ] Which GST scheme applies, and does the supplier's net price already include GST?
- [ ] Who may change the default markup, and is there a minimum margin?
- [ ] How long should a quote stay valid by default?
- [ ] English only, or also Hindi (which affects fonts)?
- [ ] How are PDFs sent to clients: download only, email, or a WhatsApp share link?
- [ ] Should each salesperson's name and contact appear on their PDFs?
- [ ] Roughly how many itineraries per day, so quotas and server size can be set?

## Future ideas beyond v1

The most valuable next step is connecting this tool to the leads tracker, so a quote starts from a lead and ends up attached to it.

- **Lead-to-quote link.** Create an itinerary from a lead record, prefill the client's name and travel details from the Meta form, store the PDF on the lead and move the lead's status when a quote is sent.
- **Shareable web version.** Serve the same template as a private link with view tracking, as TripMapper and Ratiba do with web proposals.
- **Saved packages and cloning.** Keep popular itineraries as templates and clone past ones, a feature several competitors list.
- **Own image library.** Let the agency upload and tag its own photos for common destinations once stock photos stop being enough, which also removes the attribution and quota limits.
- **Option comparison.** Support two or three variants (for example hotel categories) in one PDF with a comparison table.
- **Sending.** Email or WhatsApp delivery straight from the app.
- **Client comments and approval** on the web version.
- **Hindi and other languages**, with the right fonts.
- **Supplier rate cards** that fill the net price automatically.
- **Writing help.** A model pass that rewrites supplier descriptions into the agency's tone, always shown as a suggestion in the form.
