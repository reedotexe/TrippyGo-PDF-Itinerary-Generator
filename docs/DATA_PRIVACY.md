# TrippyGo Data Processing & Supplier Privacy Notice

**Document Reference:** TG-DPN-2026-V1  
**Classification:** Confidential — Agency Operational Compliance  
**Effective Date:** 24 October 2026  

---

## 1. Purpose & Scope
This notice documents how supplier quotes, DMC invoices, and wholesale travel arrangements are handled when processed by the TrippyGo PDF Itinerary Generator.

---

## 2. Third-Party AI Data Processing (Anthropic Claude API)
- **Model Processing:** Supplier itinerary documents and WhatsApp text extracts are ingested via the Anthropic Claude API (`claude-3-7-sonnet-20250219`).
- **Commercial Zero-Training Guarantee:** Anthropic's Commercial Terms of Service specify that data transmitted via the Claude API is **never used to train** commercial foundation models.
- **Data Retention:** API requests are processed ephemerally with standard 30-day security log retention for abuse monitoring, after which input tokens are purged.

---

## 3. Supplier PII & B2B Commercial Leak Protection
- **Automatic Provenance Stripping:**
  1. The LLM extraction prompt enforces strict instructions to ignore supplier agency names, wholesale logos, internal DMC contact numbers, and supplier bank account numbers.
  2. B2B leak validators (`src/lib/extraction/validate-extraction.ts`) scan output text for B2B keywords (`net rate`, `dmc`, `non-commissionable`, phone numbers, email addresses) and flag them into internal `reviewFlags`.
- **Client-View Airgap:**
  1. Internal supplier net rates (`netAmountPaise`) and markup specifications are structurally omitted by `computeClientView()`.
  2. PDF templates exclusively receive sanitized `ClientItineraryView` models.
  3. Continuous automated integration tests (`scripts/test-pricing-leak.ts`) parse PDF byte buffers to cryptographically guarantee 0% net amount leakage.

---

## 4. Storage & Encryption
- All generated PDF documents and extracted supplier transcripts are stored with `private` access controls in S3 / MinIO storage (`ap-south-1`).
- PDF downloads use time-limited HMAC authentication tokens (5-minute expiry) or AWS S3 pre-signed URLs (1-hour expiry).

---

## 5. Summary & Agency Sign-Off
Transmission of supplier itineraries to the Claude API under commercial enterprise terms is compliant with agency confidentiality requirements.
