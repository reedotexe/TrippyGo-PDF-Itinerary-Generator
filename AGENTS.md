<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

## UI rules
- FROZEN: never touch src/templates/itinerary/**, src/app/print/**, services/renderer/**,
  public/fonts/**, or the rendered A4 document inside the preview pane. Zero changes to the PDF
  and preview. test:visual must show zero diff on every PR. Never update baselines.
- New global CSS must not leak into the print route or preview content.
- UI tasks never touch pricing, schema, auth, API or PDF code.
- Read PRODUCT.md, DESIGN.md and docs/UI_DECISIONS.md before any UI change.
- All app UI uses shadcn/ui components from components/ui. Do not hand-roll buttons, inputs,
  dialogs, tabs, tables, badges, selects.
- Colours only from the preset tokens. No raw hex, no brand colours in the app.
- Font in the app is Inter. PDF and preview fonts are unchanged.
- One screen per task. Plan first, wait for my approval, then implement.
- After each change: run the app, screenshot at 1440px and 768px, compare to DESIGN.md
  and docs/references/, list deviations, fix them, run test:visual and test:e2e.

<!-- END:nextjs-agent-rules -->
