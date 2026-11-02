---
target_identity: "file:C:\\programming-files\\WEB-DEV\\TrippyGo\\TrippyGo-PDF-Itinerary-Generator\\src\\app\\page.tsx"
target_fingerprint: "sha256:1199c9a7ab4d4eca25b1bb40edae1ab3fbbadaa7b8b99a8f21eacff2cf93b2d1"
target_path: "C:\\programming-files\\WEB-DEV\\TrippyGo\\TrippyGo-PDF-Itinerary-Generator\\src\\app\\page.tsx"
timestamp: 2026-11-02T07-57-51Z
slug: src-app-page-tsx
---
# Impeccable Critique Snapshot: Home Dashboard (`src/app/page.tsx`)
Date: 2026-11-02
Method: dual-agent (A: f01a4069-5920-4b1b-8463-416604a27df8 · B: d38b6972-471a-4106-b023-3a10da9f5e10)

## Design Health Score
Score: 22/40 (Acceptable / Needs Work)
Heuristics evaluated: 10/10

| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 2.5/4 | Spinning modal button without incremental feedback; abrupt row deletion without toast |
| 2 | Match System / Real World | 2.5/4 | Jargon in modal ("Parsing with Claude AI", "flight legs"); 50 MB limit copy mismatch |
| 3 | User Control and Freedom | 2.5/4 | No trash recovery for sales advisors; trapped in modal if extraction hangs |
| 4 | Consistency and Standards | 1.0/4 | Hand-rolled HTML modal, banned brand hex colors (#091c3e, #c92229), ad-hoc emerald colors |
| 5 | Error Prevention | 2.5/4 | Immediate duplicate without confirmation; silent fail on invalid dropzone file types |
| 6 | Recognition Rather Than Recall | 3.0/4 | Client names subordinated in tiny muted text; middle-dot travel string is strong |
| 7 | Flexibility and Efficiency | 2.5/4 | Missing column sorting; missing quick WhatsApp/PDF link copy |
| 8 | Aesthetic and Minimalist Design | 2.0/4 | Clean dashboard shell corrupted by legacy red modal and marketing copy |
| 9 | Error Recovery | 1.5/4 | Network 500 error disguises active database as empty onboarding state |
| 10 | Help and Documentation | 2.0/4 | Kashmir tour sample is helpful; lacks guidance on supported formats and unpriced drafts |

## Design Specificity Verdict
Grounded in travel data formatting (rupee grouping, destination-date string, draft/ready status), but structurally interchangeable with generic SaaS tables. Misses temporal travel urgency (departure dates, fare expiration) and WhatsApp sharing.

## Priority Issues
- [P0] Critical Brand Color & Component Integrity Violation in NewItineraryModal.tsx
- [P1] Network Failure Silently Displays Onboarding Empty State
- [P1] Token Drift: Ad-hoc Tailwind emerald Classes Bypassing --success
- [P1] One-Primary-Per-Screen Rule Violation in Empty State
- [P2] Missing "Mine" vs. "All" Scoping for Sales Consultants vs. Admins
