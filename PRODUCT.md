# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primary User:** Travel agency salespeople / travel consultants at TrippyGo (by Friends Travel). They are often first-time or novice users of the software, working under tight time pressure to convert inbound leads. Their core job is ingesting messy, unbranded supplier quotes or WhatsApp messages and generating a client-ready, polished proposal in under 5 minutes.
- **Secondary User (Admin):** Agency owners and operational managers responsible for agency-wide commercials (baseline markup, margin floors, quote validity), statutory tax defaults (GST display, GSTIN, SAC, TCS), and overarching pipeline visibility.
- **End Client (Reader):** High-intent luxury holiday travelers (couples, families, group travelers) in India and globally evaluating bespoke vacation packages valued between ₹100,000 and ₹1,500,000+. They consume the generated output as a high-resolution A4 PDF document on mobile devices (WhatsApp/email) or physical printouts.

## Roles & Access Boundaries

- **Salesperson:** Sees and edits only their own itineraries. Dashboard defaults to "Mine". Fast-path creation, extraction review, commercial margin adjustments within allowed floors, and PDF generation. Does not access agency global settings or global KPI metrics.
- **Admin:** Full access across the system: agency financial settings, margin floors, tax compliance switches, user management, KPI overview strip, and the ability to view/manage all agency proposals.

## Product Purpose

TrippyGo eliminates the slow, error-prone manual labor of drafting holiday proposals. It ingests unbranded supplier quotes, itineraries, and WhatsApp messages, parses them with AI into structured travel components (flights, accommodations, daily itineraries, inclusions, policies, commercials), and exports high-resolution, magazine-grade bespoke PDF proposals. Success means a salesperson can comfortably open a raw supplier quote and hand a client-ready proposal to a lead in under 5 minutes with zero margin leakage.

## Positioning

Unlike generic CRM/quoting SaaS tools or raw AI wrappers that produce sterile web tables or low-fidelity "AI slop," TrippyGo combines an ultra-fast, calm internal operator workbench with a strictly decoupled, publication-grade editorial travel document (*Condé Nast Traveler* luxury aesthetic).

## Operating Context

- **Environment:** Fast-paced travel agency sales desk, typically operated on 13" to 15" laptop screens, often during live telephone calls or active WhatsApp negotiations with leads.
- **Speed & Clarity Over Flair:** The application UI is a calm, utilitarian, task-first work tool. Every element must be scanable and predictable.
- **Document Hand-off:** Proposals are delivered directly to prospective clients as multi-page A4 PDFs via WhatsApp or email.
- **The Frozen Product Boundary:** The client-facing A4 PDF and its live preview pane in the editor are a separate, frozen product. Layout, typography, colors, page breaks, and rendering behavior inside the PDF/preview are immutable and strictly isolated from the application UI.

## Capabilities and Constraints

- **AI Ingestion & Parsing:** Ingests supplier PDFs, plain text, and WhatsApp transcripts; extracts structured travel details into reviewable fields.
- **Commercial & Margin Governance:** Internal net DMC costs and markup percentages are strictly confidential and guaranteed never to render on client-facing outputs. Includes margin floor warnings and configurable rounding rules.
- **Single-Screen Discipline:** Every modal and panel adheres to a strict one-primary-button-per-screen rule and a maximum disclosure depth of two levels.
- **Strict Frozen Zone:**
  - Zero edits to `src/templates/itinerary/**`, `src/app/print/**`, `services/renderer/**`, `public/fonts/**`.
  - Zero changes to the rendered A4 document in the editor preview.
  - Global application CSS must never leak into print/preview contexts.
  - Pull request gate: visual regression tests (`npm run test:visual`) must show 0-pixel diff on all benchmark PDFs.

## Brand Commitments

- **Application UI:** Calm, neutral, functional. Built entirely on standard shadcn/ui preset tokens (white surfaces, neutral grays, single blue primary action token). Zero brand navy, heritage red, or ivory in the app UI.
- **Client PDF (Frozen):** Bespoke luxury travel journal aesthetic. TrippyGo brand palette (Navy `#091c3e`, Heritage Red `#c92229`, Warm Ivory `#fafaf7`, Gold `#f59e0b`). Self-hosted editorial typography (Cormorant Garamond display, Plus Jakarta Sans body, Caveat script).

## Evidence on Hand

- **Screenshots:** Comprehensive baseline reference archive stored at `docs/original_design_ss/` (40 screenshots covering all pages, sections, modals, and benchmark PDF pages).
- **Audit Findings:** Exhaustive UX and cognitive load analysis recorded in `docs/UI_AUDIT.md`.
- **Decision Record:** Locked product and UX requirements recorded in `docs/UI_DECISIONS.md`.
- **Visual Benchmarks:** 8 benchmark golden PDFs evaluated by Playwright visual regression test suite (`tests/visual/`).

## Product Principles

1. **Speed and Clarity Beat Flair:** The application UI is an internal power tool for busy salespeople. No decorative gradients, no unnecessary animations, and no visual clutter.
2. **One Primary Action per Screen:** A user should never wonder what to do next. Every screen, tab, and dialog has at most one dominant primary action.
3. **Never Expose Wholesale Costs or Leak Margins:** Salespeople must trust the system completely. Net supplier rates and margin calculations remain strictly internal.
4. **Decoupled Architecture:** The web application and the PDF generation engine are separate worlds. Changes to the web UI must never touch or alter the PDF rendering output.
5. **Human in the Loop:** AI extractions are drafts, not final facts. Extracted fields requiring verification are highlighted clearly and auto-clear upon editing.
