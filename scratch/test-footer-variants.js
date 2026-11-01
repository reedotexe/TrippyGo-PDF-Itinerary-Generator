const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/Admin/.gemini/antigravity/brain/9627fe67-27b9-421a-a4db-5bb956f502d1';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1000, height: 800 }, deviceScaleFactor: 2 });

  // HTML test bed for footer variants
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap">
  <style>
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background: #0b1120;
      padding: 40px 20px;
      color: white;
    }
    .variant-card {
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      margin-bottom: 40px;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3);
    }
  </style>
</head>
<body>
  <div class="max-w-4xl mx-auto space-y-8">

    <!-- CURRENT DESIGN (FOR COMPARISON) -->
    <div class="variant-card">
      <div class="p-4 bg-slate-100 text-slate-800 text-xs font-bold uppercase tracking-wider border-b">
        Current Design (User Feedback: "looks sooo bad")
      </div>
      <footer class="bg-[#091c3e] text-white p-3.5 px-8 border-t-2 border-[#FFDE59] flex flex-col gap-2.5 text-xs font-body">
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-4 text-[11px] font-medium">
            <span class="flex items-center gap-1.5 text-slate-200">
              <span class="text-[#FFDE59]">📞</span> +91 9941000075 • +91 7557500007
            </span>
            <span class="flex items-center gap-1.5 text-slate-200">
              <span class="text-[#FFDE59]">✉️</span> harkiran@trippygo.in
            </span>
            <span class="flex items-center gap-1.5 text-slate-200">
              <span class="text-[#FFDE59]">🌐</span> trippygo.in
            </span>
          </div>
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-0.5 rounded-full bg-white/10 border border-white/15 text-[10.5px] font-semibold">📸 @trippygo.co</span>
            <span class="px-2.5 py-0.5 rounded-full bg-white/10 border border-white/15 text-[10.5px] font-semibold">📘 Trippygo</span>
          </div>
        </div>
        <div class="pt-2 border-t border-white/10 flex items-center justify-between text-[10.5px] text-slate-300">
          <div class="flex items-center gap-1.5">
            <span class="text-[#FFDE59]">📍</span> Eden Tower, Phase 8B, Sector 91, Mohali, Punjab
          </div>
          <div class="flex items-center gap-2 text-[10px]">
            <span class="font-mono text-[10px] font-bold text-amber-300 bg-white/10 px-2 py-0.5 rounded border border-white/15 tracking-wider">
              PAGE 02 / 10
            </span>
            <span><strong class="text-white">Trippy<span class="text-[#3b82f6]">Go</span></strong> by Friends Travels • All Rights Reserved</span>
          </div>
        </div>
      </footer>
    </div>

    <!-- VARIANT A: PURE EDITORIAL FOLIO (UNBOXED, REBALANCED TIERS) -->
    <div class="variant-card">
      <div class="p-4 bg-slate-100 text-slate-800 text-xs font-bold uppercase tracking-wider border-b">
        Variant A: Pure Editorial Folio (Unboxed, Rebalanced Tiers)
      </div>
      <footer class="bg-[#091c3e] text-white p-3.5 px-8 border-t-2 border-[#FFDE59] flex flex-col gap-2.5 text-xs font-body">
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-4 text-[11px] font-medium">
            <span class="flex items-center gap-1.5 text-slate-200">
              <span class="text-[#FFDE59]">📞</span> +91 9941000075 • +91 7557500007
            </span>
            <span class="flex items-center gap-1.5 text-slate-200">
              <span class="text-[#FFDE59]">✉️</span> harkiran@trippygo.in
            </span>
            <span class="flex items-center gap-1.5 text-slate-200">
              <span class="text-[#FFDE59]">🌐</span> trippygo.in
            </span>
          </div>
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-0.5 rounded-full bg-white/10 border border-white/15 text-[10.5px] font-semibold">📸 @trippygo.co</span>
            <span class="px-2.5 py-0.5 rounded-full bg-white/10 border border-white/15 text-[10.5px] font-semibold">📘 Trippygo</span>
          </div>
        </div>
        <div class="pt-2 border-t border-white/10 flex items-center justify-between text-[10.5px]">
          <div class="flex items-center gap-3 text-slate-300">
            <span class="flex items-center gap-1.5">
              <span class="text-[#FFDE59]">📍</span> Eden Tower, Phase 8B, Sector 91, Mohali, Punjab
            </span>
            <span class="text-white/20">•</span>
            <span class="text-slate-400 text-[10px]">
              <strong class="text-white">Trippy<span class="text-[#3b82f6]">Go</span></strong> by Friends Travels • All Rights Reserved
            </span>
          </div>
          <!-- Clean Folio Anchor -->
          <div class="flex items-center gap-1.5 shrink-0 tracking-wider font-body">
            <span class="text-[9px] uppercase font-bold tracking-[0.22em] text-slate-400">Page</span>
            <span class="text-[#FFDE59] font-bold text-xs tabular-nums">02</span>
            <span class="text-white/25 font-light text-[11px]">/</span>
            <span class="text-slate-300 font-semibold text-xs tabular-nums">10</span>
          </div>
        </div>
      </footer>
    </div>

    <!-- VARIANT B: LUXURY EDITORIAL EM-DASH FOLIO -->
    <div class="variant-card">
      <div class="p-4 bg-slate-100 text-slate-800 text-xs font-bold uppercase tracking-wider border-b">
        Variant B: Luxury Editorial Em-Dash Folio
      </div>
      <footer class="bg-[#091c3e] text-white p-3.5 px-8 border-t-2 border-[#FFDE59] flex flex-col gap-2.5 text-xs font-body">
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-4 text-[11px] font-medium">
            <span class="flex items-center gap-1.5 text-slate-200">
              <span class="text-[#FFDE59]">📞</span> +91 9941000075 • +91 7557500007
            </span>
            <span class="flex items-center gap-1.5 text-slate-200">
              <span class="text-[#FFDE59]">✉️</span> harkiran@trippygo.in
            </span>
            <span class="flex items-center gap-1.5 text-slate-200">
              <span class="text-[#FFDE59]">🌐</span> trippygo.in
            </span>
          </div>
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-0.5 rounded-full bg-white/10 border border-white/15 text-[10.5px] font-semibold">📸 @trippygo.co</span>
            <span class="px-2.5 py-0.5 rounded-full bg-white/10 border border-white/15 text-[10.5px] font-semibold">📘 Trippygo</span>
          </div>
        </div>
        <div class="pt-2 border-t border-white/10 flex items-center justify-between text-[10.5px]">
          <div class="flex items-center gap-3 text-slate-300">
            <span class="flex items-center gap-1.5">
              <span class="text-[#FFDE59]">📍</span> Eden Tower, Phase 8B, Sector 91, Mohali, Punjab
            </span>
            <span class="text-white/20">•</span>
            <span class="text-slate-400 text-[10px]">
              <strong class="text-white">Trippy<span class="text-[#3b82f6]">Go</span></strong> by Friends Travels • All Rights Reserved
            </span>
          </div>
          <!-- Em-dash Folio -->
          <div class="flex items-center gap-1.5 shrink-0 text-slate-300">
            <span class="text-[9px] uppercase font-bold tracking-[0.25em] text-[#FFDE59]">PAGE</span>
            <span class="text-white font-bold text-xs tabular-nums">02</span>
            <span class="text-white/30 mx-0.5">—</span>
            <span class="text-slate-400 font-medium text-xs tabular-nums">10</span>
          </div>
        </div>
      </footer>
    </div>

    <!-- VARIANT C: REFINED OBSIDIAN CAPSULE (IF USER WANTS A PILL BADGE BUT LUXURY) -->
    <div class="variant-card">
      <div class="p-4 bg-slate-100 text-slate-800 text-xs font-bold uppercase tracking-wider border-b">
        Variant C: Refined Obsidian Capsule (Jewel-Tone Pill)
      </div>
      <footer class="bg-[#091c3e] text-white p-3.5 px-8 border-t-2 border-[#FFDE59] flex flex-col gap-2.5 text-xs font-body">
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-4 text-[11px] font-medium">
            <span class="flex items-center gap-1.5 text-slate-200">
              <span class="text-[#FFDE59]">📞</span> +91 9941000075 • +91 7557500007
            </span>
            <span class="flex items-center gap-1.5 text-slate-200">
              <span class="text-[#FFDE59]">✉️</span> harkiran@trippygo.in
            </span>
            <span class="flex items-center gap-1.5 text-slate-200">
              <span class="text-[#FFDE59]">🌐</span> trippygo.in
            </span>
          </div>
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-0.5 rounded-full bg-white/10 border border-white/15 text-[10.5px] font-semibold">📸 @trippygo.co</span>
            <span class="px-2.5 py-0.5 rounded-full bg-white/10 border border-white/15 text-[10.5px] font-semibold">📘 Trippygo</span>
          </div>
        </div>
        <div class="pt-2 border-t border-white/10 flex items-center justify-between text-[10.5px]">
          <div class="flex items-center gap-3 text-slate-300">
            <span class="flex items-center gap-1.5">
              <span class="text-[#FFDE59]">📍</span> Eden Tower, Phase 8B, Sector 91, Mohali, Punjab
            </span>
            <span class="text-white/20">•</span>
            <span class="text-slate-400 text-[10px]">
              <strong class="text-white">Trippy<span class="text-[#3b82f6]">Go</span></strong> by Friends Travels • All Rights Reserved
            </span>
          </div>
          <!-- Refined Jewel Pill -->
          <div class="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#051124] border border-[#FFDE59]/30 text-xs shrink-0 shadow-2xs">
            <span class="text-[9px] uppercase font-bold tracking-[0.2em] text-[#FFDE59]">PAGE</span>
            <span class="text-white font-bold text-[11px] tabular-nums">02</span>
            <span class="text-white/30 text-[10px]">/</span>
            <span class="text-slate-400 font-medium text-[11px] tabular-nums">10</span>
          </div>
        </div>
      </footer>
    </div>

  </div>
</body>
</html>
  `;

  await page.setContent(htmlContent, { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'footer-variants-comparison.png'), fullPage: true });
  console.log('Comparison captured to footer-variants-comparison.png');

  await browser.close();
})();
