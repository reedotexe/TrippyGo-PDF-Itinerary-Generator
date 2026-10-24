# TrippyGo Data Privacy & Processing Note

**Document Status:** Approved Internal Policy  
**Effective Date:** 2026-10-24  
**Applies to:** TrippyGo Itinerary Platform, Sales Operations, and DMC Supplier Integrations  

---

## 1. Executive Summary

TrippyGo's automated PDF Itinerary Generator processes supplier quotes, DMC rate sheets, and WhatsApp proposals to generate branded, executive travel proposals for clients. Because supplier quotes contain proprietary wholesale pricing, supplier contact details, and itinerary structures, safeguarding this data is a core business requirement.

This document outlines the data governance, commercial API privacy terms, and architectural isolation implemented across the TrippyGo system.

---

## 2. Third-Party AI Data Processing (Anthropic Claude API)

When an itinerary quote is uploaded or pasted, the document text or PDF base64 is processed via Anthropic's Claude API (`claude-3-7-sonnet-20250219`) to extract structured itinerary entities (day activities, hotel stays, inclusions/exclusions, pricing).

### 2.1 Model Training & Data Use Policy
* **Zero Model Training by Default:** Under Anthropic's **Commercial Terms of Service** (covering API endpoints and Enterprise workspaces), customer inputs and outputs are **never** used to train or fine-tune Anthropic models.
* **Automatic Commercial Protection:** Unlike consumer accounts (Claude Free/Pro) which operate on an opt-out basis, commercial API accounts are wall-off by default without requiring manual opt-out requests.
* **No Third-Party Access:** Prompt data is processed in isolated inference containers and is never shared with third parties or external data brokers.

### 2.2 Data Retention Policy
* **Standard Retention Window:** API prompt and completion payloads are retained for a maximum of **30 days** solely for platform security, trust and safety, and abuse prevention.
* **Automated Purging:** Data is automatically deleted from Anthropic's backend upon expiration of the 30-day monitoring window.
* **Zero Data Retention (ZDR) Option:** If TrippyGo establishes direct enterprise agreements or routes requests via AWS Bedrock / GCP Vertex AI, Zero Data Retention (where zero payload is logged beyond real-time inference) can be enabled on request.

---

## 3. System Architecture & Confidentiality Safeguards

TrippyGo enforces strict multi-layered isolation between raw supplier quotes and client-facing documents:

### 3.1 Confidential Net Rate & Provenance Stripping
* **Separate Storage Tiers:** Raw supplier itineraries, wholesale net prices, and DMC identifying headers are stored in staff-only storage buckets and restricted database fields.
* **Compilation-Level Scrubbing:** The public print route and client preview are generated solely through `computeClientView()`. This function strips:
  - Supplier net amount (`netAmountPaise`)
  - Agency markup value and markup type
  - Net margin percentage
  - Source supplier file paths and vendor notes
  - Internal AI extraction metadata and flags
* **Cryptographic PDF Text Stream Audit:** The system includes automated regression tests (`scripts/test-pricing-leak.ts`) that decompress and inspect the raw text stream of rendered PDF buffers to guarantee that zero supplier net rates, supplier names, or markup figures appear in customer-facing proposals.

### 3.2 Network Isolation & SSRF Defense
* The headless PDF rendering cluster enforces egress filtering that explicitly aborts any requests originating from within the document to internal subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `127.0.0.0/8`), AWS IMDS metadata (`169.254.169.254`), or loopback ports.

### 3.3 Access Control & Audit Trails
* **Role-Based Permissions:** Salespeople have access only to their assigned itineraries. Only authorized Administrators can view agency-wide margin configurations and system settings.
* **HMAC Render Tokens:** PDF rendering URLs are signed with short-lived HMAC tokens (5-minute expiry) to prevent enumeration and unauthorized link sharing.
* **Pre-Signed S3 URLs:** All document downloads use time-limited pre-signed URLs (1-hour expiry); no storage buckets or raw object keys are exposed to the client.

---

## 4. Operational Recommendations for Sales Staff

To maintain maximum confidentiality and client privacy:
1. **Sanitize Traveler PII Before Upload:** When copying WhatsApp messages or DMC email quotes into the upload box, remove personal client identity numbers (passport numbers, Aadhaar, PAN card copies) if they were accidentally attached.
2. **Review Extracted Margin:** Always confirm the selling price and margin badge on the review screen prior to generating the final PDF.
3. **Report Anomalies:** If an unfamiliar supplier disclaimer appears in an extracted itinerary, flag it using the review screen before releasing the client quote.

---

## 5. Summary & Sign-off

The TrippyGo PDF Itinerary Generator is fully compliant with commercial data privacy standards and Anthropic's zero-training terms for commercial API customers. Supplier pricing and confidential DMC rates remain strictly protected within the agency boundary.
