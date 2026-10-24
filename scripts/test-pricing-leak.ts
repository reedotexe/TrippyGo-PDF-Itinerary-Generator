import fs from "fs";
import path from "path";
import { PDFParse } from "pdf-parse";
import { chromium } from "playwright";
import {
  computeMarkupPaise,
  applyRounding,
  computeSellingPricePaise,
  computeMarginPercent,
  computeGstPaise,
  formatInr,
  formatInrBare,
  computeTravellerUnits,
  isMarginBelowFloor,
  calculatePricingBreakdown,
} from "../src/lib/pricing";
import { Itinerary } from "../src/lib/schema/itinerary";
import { computeClientView } from "../src/lib/schema/client-view";

async function runPhase6Tests() {
  console.log("=== RUNNING PHASE 6 PRICING, ROUNDING & LEAK SUITE ===\n");

  // -------------------------------------------------------------
  // TEST 1: Pure Pricing Engine Unit Calculations
  // -------------------------------------------------------------
  console.log("[Test 1] Testing pure math functions in src/lib/pricing.ts...");

  // 1a. Markup calculation
  const netPaise = 5200000; // ₹52,000
  const markupPercentPaise = computeMarkupPaise(netPaise, { type: "percent", value: 15 });
  if (markupPercentPaise !== 780000) {
    throw new Error(`Expected 15% of 5,200,000 to be 780,000, got ${markupPercentPaise}`);
  }

  const markupFlatPaise = computeMarkupPaise(netPaise, { type: "flat", valuePaise: 500000 });
  if (markupFlatPaise !== 500000) {
    throw new Error(`Expected flat markup of 500,000, got ${markupFlatPaise}`);
  }

  // 1b. Margin percentage
  const marginPct = computeMarginPercent(netPaise, { type: "percent", value: 15 });
  if (marginPct !== 15) {
    throw new Error(`Expected margin percent 15, got ${marginPct}`);
  }
  const flatMarginPct = computeMarginPercent(1000000, { type: "flat", valuePaise: 250000 });
  if (flatMarginPct !== 25) {
    throw new Error(`Expected flat margin percent 25, got ${flatMarginPct}`);
  }

  // 1c. Rounding rules
  const testOddPaise = 5980123; // ₹59,801.23
  const roundedRupee = applyRounding(testOddPaise, "nearest_rupee");
  if (roundedRupee !== 5980100) {
    throw new Error(`Expected nearest rupee 5980100, got ${roundedRupee}`);
  }

  const rounded50 = applyRounding(testOddPaise, "nearest_50");
  if (rounded50 !== 5985000) { // Ceil to next ₹50 = 59,850
    throw new Error(`Expected nearest 50 to be 5985000, got ${rounded50}`);
  }

  const rounded100 = applyRounding(testOddPaise, "nearest_100");
  if (rounded100 !== 5990000) { // Ceil to next ₹100 = 59,900
    throw new Error(`Expected nearest 100 to be 5990000, got ${rounded100}`);
  }

  // 1d. GST modes
  const sellingPaise = 5980000; // ₹59,800
  const gstInclusive = computeGstPaise(sellingPaise, 0.05, "inclusive");
  // 59,800 - 59,800 / 1.05 = 2,847.61 -> 2848 rupees = 284762 paise
  const expectedGstInclusive = Math.round(sellingPaise - sellingPaise / 1.05);
  if (gstInclusive !== expectedGstInclusive) {
    throw new Error(`Expected inclusive GST ${expectedGstInclusive}, got ${gstInclusive}`);
  }

  const gstExtra = computeGstPaise(sellingPaise, 0.05, "extra");
  if (gstExtra !== Math.round(sellingPaise * 0.05)) {
    throw new Error(`Expected extra GST ${sellingPaise * 0.05}, got ${gstExtra}`);
  }

  const gstHidden = computeGstPaise(sellingPaise, 0.05, "hidden");
  if (gstHidden !== 0) {
    throw new Error(`Expected hidden GST to be 0, got ${gstHidden}`);
  }

  // 1e. Indian Number Formatting (lakhs/crores comma separator)
  const formattedInr = formatInr(12500000); // 1,25,000 INR
  if (!formattedInr.includes("1,25,000")) {
    throw new Error(`Expected formatInr to include '1,25,000', got '${formattedInr}'`);
  }

  const bareInr = formatInrBare(12500000);
  if (bareInr !== "1,25,000") {
    throw new Error(`Expected formatInrBare to be '1,25,000', got '${bareInr}'`);
  }

  // 1f. Passenger weighting
  const units = computeTravellerUnits({ adults: 2, childrenWithBed: 1, childrenWithoutBed: 1, infants: 1 });
  // 2*1.0 + 1*0.7 + 1*0.4 + 1*0 = 3.1
  if (Math.abs(units - 3.1) > 0.001) {
    throw new Error(`Expected traveller units 3.1, got ${units}`);
  }

  // 1g. Floor margin check
  if (!isMarginBelowFloor(6, 8)) {
    throw new Error("6% should be below 8% floor");
  }
  if (isMarginBelowFloor(12, 8)) {
    throw new Error("12% should NOT be below 8% floor");
  }

  console.log("PASS: All unit calculations, rounding rules, GST modes, and INR formatting verified.\n");

  // -------------------------------------------------------------
  // TEST 2: Master Pricing Breakdown & TCS Flag
  // -------------------------------------------------------------
  console.log("[Test 2] Testing calculatePricingBreakdown with TCS flag enabled...");
  const breakdownTcs = calculatePricingBreakdown(
    4000000, // ₹40,000 net
    { type: "percent", value: 20 }, // 20% markup -> ₹48,000 selling price
    "extra",
    0.05,
    "998552",
    { tcsEnabled: true }
  );

  if (breakdownTcs.baseSellingPriceRupees !== 48000) {
    throw new Error(`Expected baseSellingPriceRupees 48000, got ${breakdownTcs.baseSellingPriceRupees}`);
  }
  if (breakdownTcs.gstAmountRupees !== 2400) { // 5% of 48,000 = 2,400
    throw new Error(`Expected gstAmountRupees 2400, got ${breakdownTcs.gstAmountRupees}`);
  }
  if (breakdownTcs.finalClientPriceRupees !== 50400) { // 48,000 + 2,400 = 50,400
    throw new Error(`Expected finalClientPriceRupees 50400, got ${breakdownTcs.finalClientPriceRupees}`);
  }
  if (!breakdownTcs.tcsDisclaimer || !breakdownTcs.tcsDisclaimer.includes("Sec 206C")) {
    throw new Error("Expected TCS disclaimer to be present under Sec 206C");
  }
  console.log("PASS: Master pricing breakdown computed accurately with separate TCS disclosure.\n");

  // -------------------------------------------------------------
  // TEST 3: Automated PDF Confidential Data Leak Verification
  // -------------------------------------------------------------
  console.log("[Test 3] Running Automated PDF Net Rate & Markup Leak Test...");

  const confidentialNetPaise = 4750000; // ₹47,500 confidential supplier net rate
  const confidentialNetRupees = "47,500";
  const confidentialRawAmount = "47500";

  const leakTestItinerary: Itinerary = {
    schemaVersion: 1,
    package: {
      title: "Confidentiality Audit Package (Leak Test)",
      destinations: ["Munnar", "Thekkady"],
      nights: 3,
      days: 4,
      startDate: "2026-11-20",
      travellers: { adults: 2, children: 0, rooms: 1 },
    },
    days: [
      {
        dayNumber: 1,
        title: "Scenic Transfer to Munnar Tea Hills",
        description: "Private cab transfer to hotel through tea plantations.",
        activities: ["Cheeyappara waterfalls", "Tea plantation walk"],
        meals: ["Dinner"],
        stay: { hotel: "Grand Tea Resort", city: "Munnar", roomType: "Valley View" },
        imageQuery: "Munnar tea hills",
        image: null,
      },
    ],
    inclusions: ["3 Nights luxury stay", "Daily breakfast & dinner", "Private AC vehicle"],
    exclusions: ["Airfare", "Entry fees"],
    pricing: {
      currency: "INR",
      basis: "per_person_twin_sharing",
      netAmountPaise: confidentialNetPaise, // 4,750,000 paise
      markup: { type: "percent", value: 15 }, // 15% -> ₹54,625
      gstMode: "inclusive",
      gstRate: 0.05,
      sacCode: "998552",
      validityDays: 7,
    },
    terms: {
      payment: ["50% advance to confirm"],
      cancellation: [{ window: "> 15 days", charge: "Free cancellation" }],
    },
    meta: {
      sourceFile: "supplier_dmc_confidential_quote.pdf",
      extractedBy: "claude-sonnet-4-5",
      reviewFlags: [
        { field: "pricing.netAmountPaise", issue: "Supplier net rate B2B", severity: "info" },
      ],
      extractedSnapshot: { supplierInternalContact: "+91 99999 88888" },
    },
    variants: [],
    salesperson: { name: "Audit Specialist", phone: "+91 98765 00000", email: "audit@trippygo.com" },
  };

  // 3a. Verify Schema Client View Masking
  const clientView = computeClientView(leakTestItinerary);

  // Assert confidential fields are absent from client view object
  const clientViewJson = JSON.stringify(clientView);
  if (clientViewJson.includes("47500") || clientViewJson.includes("47,500")) {
    throw new Error("SECURITY BREACH: Client view object contains supplier net cost!");
  }
  if (clientViewJson.includes("supplierInternalContact") || clientViewJson.includes("99999 88888")) {
    throw new Error("SECURITY BREACH: Client view object contains internal supplier metadata!");
  }
  console.log("  -> computeClientView() successfully stripped net amounts and internal meta.");

  // 3b. Render A4 PDF Buffer using Playwright
  console.log("  -> Rendering PDF via Playwright Chromium...");
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
  });

  const page = await browser.newPage();
  await page.setViewportSize({ width: 1200, height: 1600 });

  const html = `<!DOCTYPE html>
<html>
<head>
  <style>
    @page { size: A4; margin: 10mm; }
    body { font-family: sans-serif; }
  </style>
</head>
<body>
  <h1>${clientView.package.title}</h1>
  <div>Package Investment: ₹ ${clientView.pricing.finalPriceFormatted}</div>
  <div>Basis: ${clientView.pricing.basis}</div>
  <div>GST: 5% Inclusive (SAC ${clientView.pricing.sacCode})</div>
  <div>Specialist: ${clientView.salesperson?.name}</div>
</body>
</html>`;

  await page.setContent(html, { waitUntil: "networkidle" });
  await page.emulateMedia({ media: "print" });
  const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
  await browser.close();

  // 3c. Extract text from PDF using PDFParse
  console.log("  -> Parsing PDF text stream using PDFParse...");
  const parser = new PDFParse({ data: pdfBuffer });
  const textResult = await parser.getText();
  const pdfText = textResult.text;
  await parser.destroy();

  // 3d. Assert Zero Leakage of confidential supplier figures
  if (pdfText.includes(confidentialNetRupees) || pdfText.includes(confidentialRawAmount)) {
    throw new Error(`SECURITY LEAK IN PDF: Found confidential net rate in rendered text: "${confidentialRawAmount}"`);
  }
  if (pdfText.includes("4750000")) {
    throw new Error("SECURITY LEAK IN PDF: Found raw net paise in rendered text!");
  }

  // 3e. Assert client selling price and SAC code ARE visible
  if (!pdfText.includes("54,625")) {
    throw new Error(`Client selling price ₹54,625 missing from PDF text! Found:\n${pdfText}`);
  }
  if (!pdfText.includes("998552")) {
    throw new Error("SAC Code 998552 missing from PDF text!");
  }

  console.log("PASS: Automated PDF Leak Test passed 100%! ZERO supplier net rates or internal meta leaked into PDF.\n");

  console.log("=== ALL PHASE 6 TESTS PASSED SUCCESSFULLY ===");
}

runPhase6Tests().catch((err) => {
  console.error("FATAL: Phase 6 test failed:", err);
  process.exit(1);
});
