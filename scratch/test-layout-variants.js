const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/Admin/.gemini/antigravity/brain/9627fe67-27b9-421a-a4db-5bb956f502d1';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 900, height: 1200 }, deviceScaleFactor: 2 });

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
      background: #0f172a;
      padding: 40px 20px;
      color: white;
    }
    .variant-card {
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      margin-bottom: 35px;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3);
    }
    .footer-base {
      background-color: #091c3e;
      color: #ffffff;
      border-top: 2px solid #FFDE59;
    }
  </style>
</head>
<body>
  <div class="max-w-3xl mx-auto space-y-6">

    <!-- CURRENT (WITH THE UGLY WRAP) -->
    <div class="variant-card">
      <div class="p-3 bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider border-b">
        Current Design: trippygo.in wraps awkwardly, "FOLLOW US:" takes too much room
      </div>
      <footer class="footer-base p-3.5 px-8 flex flex-col gap-2.5 text-xs">
        <div class="flex items-center justify-between gap-3">
          <div class="flex flex-wrap items-center gap-3.5 text-[11px] font-medium">
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
          <div class="flex items-center gap-2 shrink-0">
            <span class="text-[9.5px] uppercase font-bold tracking-[0.18em] text-[#FFDE59]/90">FOLLOW US:</span>
            <span class="px-2.5 py-0.5 rounded-full bg-white/10 border border-white/15 text-[10.5px] font-semibold">📸 @trippygo.co</span>
            <span class="px-2.5 py-0.5 rounded-full bg-white/10 border border-white/15 text-[10.5px] font-semibold">📘 Trippygo</span>
          </div>
        </div>
        <div class="pt-2.5 border-t border-white/10 flex items-center justify-between text-[10.5px]">
          <div class="flex items-center gap-2.5 text-slate-300">
            <span>📍 Eden Tower, Phase 8B, Sector 91, Mohali, Punjab</span>
            <span class="text-white/20">•</span>
            <span class="text-slate-400 text-[10px]"><strong class="text-white">Trippy<span class="text-[#3b82f6]">Go</span></strong> by Friends Travels • All Rights Reserved</span>
          </div>
          <div class="flex items-center gap-1.5 text-slate-300">
            <span class="text-[9px] uppercase font-bold tracking-[0.22em] text-slate-400">Page</span>
            <span class="text-[#FFDE59] font-bold text-xs tabular-nums">02</span>
            <span class="text-white/25">/</span>
            <span class="text-slate-300 font-semibold text-xs tabular-nums">10</span>
          </div>
        </div>
      </footer>
    </div>

    <!-- PROPOSED VARIANT 1: STREAMLINED SINGLE-LINE TIER 1 WITHOUT "FOLLOW US" -->
    <div class="variant-card">
      <div class="p-3 bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider border-b">
        Layout 1: Pure Single-Line Baseline (No "Follow Us", Contacts Left, Socials Right)
      </div>
      <footer class="footer-base p-3 px-8 flex flex-col gap-2 text-xs">
        <!-- Tier 1: Zero wrap, crisp shared baseline -->
        <div class="flex items-center justify-between gap-4">
          <div class="flex items-center gap-4 text-[11px] font-medium text-slate-200">
            <span class="flex items-center gap-1.5 hover:text-white transition">
              <span class="text-[#FFDE59]">📞</span> +91 9941000075 • +91 7557500007
            </span>
            <span class="text-white/20">•</span>
            <span class="flex items-center gap-1.5 hover:text-white transition">
              <span class="text-[#FFDE59]">✉️</span> harkiran@trippygo.in
            </span>
            <span class="text-white/20">•</span>
            <span class="flex items-center gap-1.5 hover:text-white transition">
              <span class="text-[#FFDE59]">🌐</span> trippygo.in
            </span>
          </div>
          <!-- Clean Social Pills (Right) -->
          <div class="flex items-center gap-2 shrink-0">
            <span class="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white text-[10.5px] font-semibold transition shadow-2xs">
              <span class="text-[#FFDE59]">📸</span> @trippygo.co
            </span>
            <span class="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white text-[10.5px] font-semibold transition shadow-2xs">
              <span class="text-[#FFDE59]">📘</span> Trippygo
            </span>
          </div>
        </div>

        <!-- Tier 2: Location, Provenance & Page Number -->
        <div class="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-300">
          <div class="flex items-center gap-2.5">
            <span class="flex items-center gap-1.5 text-slate-300">
              <span class="text-[#FFDE59]">📍</span> Eden Tower, Phase 8B, Sector 91, Mohali, Punjab
            </span>
            <span class="text-white/20">•</span>
            <span class="text-slate-400">
              <strong class="text-white font-bold">Trippy<span class="text-[#3b82f6]">Go</span></strong> by Friends Travels • All Rights Reserved
            </span>
          </div>
          <!-- Dedicated Page Folio -->
          <div class="flex items-center gap-1.5 shrink-0 tracking-wider font-body">
            <span class="text-[9px] uppercase font-bold tracking-[0.22em] text-slate-400">Page</span>
            <span class="text-[#FFDE59] font-bold text-xs tabular-nums">02</span>
            <span class="text-white/25 font-light text-[11px]">/</span>
            <span class="text-slate-300 font-semibold text-xs tabular-nums">10</span>
          </div>
        </div>
      </footer>
    </div>

    <!-- PROPOSED VARIANT 2: SUBTLE ACCENT DIVIDER PILLS (EDITORIAL SLEEK) -->
    <div class="variant-card">
      <div class="p-3 bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider border-b">
        Layout 2: Architectural Hairline Dividers (High-End Luxury Editorial)
      </div>
      <footer class="footer-base p-3.5 px-8 flex flex-col gap-2.5 text-xs">
        <!-- Tier 1 -->
        <div class="flex items-center justify-between gap-4">
          <div class="flex items-center divide-x divide-white/15 text-[11px] font-medium text-slate-200">
            <span class="flex items-center gap-1.5 pr-3.5">
              <span class="text-[#FFDE59]">📞</span> +91 9941000075 • +91 7557500007
            </span>
            <span class="flex items-center gap-1.5 px-3.5">
              <span class="text-[#FFDE59]">✉️</span> harkiran@trippygo.in
            </span>
            <span class="flex items-center gap-1.5 pl-3.5">
              <span class="text-[#FFDE59]">🌐</span> trippygo.in
            </span>
          </div>
          <!-- Social Icons / Badges -->
          <div class="flex items-center gap-2 shrink-0">
            <span class="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900/60 border border-white/15 text-white text-[10.5px] font-semibold shadow-inner">
              <span class="text-[#FFDE59]">📸</span> @trippygo.co
            </span>
            <span class="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900/60 border border-white/15 text-white text-[10.5px] font-semibold shadow-inner">
              <span class="text-[#FFDE59]">📘</span> Trippygo
            </span>
          </div>
        </div>

        <!-- Tier 2 -->
        <div class="pt-2 border-t border-white/10 flex items-center justify-between text-[10px]">
          <div class="flex items-center gap-3 text-slate-400">
            <span class="flex items-center gap-1.5 text-slate-300">
              <span class="text-[#FFDE59]">📍</span> Eden Tower, Phase 8B, Sector 91, Mohali, Punjab
            </span>
            <span class="text-white/20">•</span>
            <span><strong class="text-white">Trippy<span class="text-[#3b82f6]">Go</span></strong> by Friends Travels • All Rights Reserved</span>
          </div>
          <div class="flex items-center gap-1.5 tracking-wider font-body">
            <span class="text-[9px] uppercase font-bold tracking-[0.24em] text-slate-400">Page</span>
            <span class="text-[#FFDE59] font-bold text-xs tabular-nums">02</span>
            <span class="text-white/25">/</span>
            <span class="text-slate-300 font-semibold text-xs tabular-nums">10</span>
          </div>
        </div>
      </footer>
    </div>

  </div>
</body>
</html>
  `;

  await page.setContent(htmlContent, { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'footer-layout-variants.png'), fullPage: true });
  console.log('Layout variants captured to footer-layout-variants.png');

  await browser.close();
})();
