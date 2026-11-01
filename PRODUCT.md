# TrippyGo — Product & Design Foundation

## 1. Product Overview
TrippyGo PDF Itinerary Generator is an internal tool for travel sales professionals at TrippyGo (by Friends Travel). It ingests unbranded supplier quotes, itineraries, and WhatsApp messages, parses them with AI, and exports print-ready, high-resolution bespoke PDF proposals for clients.

## 2. Target Audience & Usage Context
- **End Clients:** High-intent travelers (couples, families, luxury explorers) in India and globally evaluating premium vacation proposals worth ₹100,000 to ₹1,500,000+.
- **Viewing Surfaces:**
  1. High-resolution WhatsApp/email PDF attachments on smartphones and tablets.
  2. Printed A4 proposals presented physically or in travel dossier binders.
  3. Live interactive preview in the internal sales dashboard (`/itineraries/[id]/edit`).

## 3. Brand Voice & Emotional Tone
- **Curated, Editorial, Authoritative:** Reads like *Condé Nast Traveler* or a boutique hotel portfolio, not a logistics invoice or automated SaaS dashboard.
- **Trustworthy & Transparent:** Clear inclusions, precise day-by-day narratives, flight boarding-pass styling, and upfront remittance details without deceptive micro-print.
- **Zero AI-Slop:** Natural, human-curated tone. Elimination of synthetic fluff phrases ("Destination Spotlight", "Carefully designed experiences").

## 4. Key Constraints
- Fixed A4 Portrait geometry (`210mm x 297mm`).
- Chromium print emulation via Playwright (`preferCSSPageSize: true`, `printBackground: true`).
- Strictly zero orphaned headers (`break-after: avoid`) and zero split day blocks (`break-inside: avoid`).
- Fonts must be self-hosted locally in `public/fonts/` for offline/isolated rendering without CDN dependencies.
