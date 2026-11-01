import { chromium } from "playwright";
import { getItinerary, saveItineraryData } from "../src/lib/db/itineraries";
import { computeClientView } from "../src/lib/schema/client-view";
import * as path from "path";
import * as fs from "fs";

async function runEndToEndVerification() {
  console.log("=== VERIFYING 2-MODE PRICING & ZERO EXCLUDED ROWS IN PDF ===");

  const itineraryId = "feb43b07-4013-47eb-a80c-40fb494eba70";
  const existing = await getItinerary(itineraryId);
  if (!existing) {
    console.error("Test itinerary not found!");
    process.exit(1);
  }

  // -------------------------------------------------------------
  // Test Case 1: Supplier Mode (DMC quote + 15% markup + Flight)
  // -------------------------------------------------------------
  console.log("\n[Test Case 1] Setting up Supplier Itinerary...");
  existing.pricing = {
    ...existing.pricing,
    pricingType: "supplier",
    markup: { type: "percent", value: 15 },
    gstMode: "inclusive",
    supplierBreakup: {
      supplierCostPaise: 6000000, // ₹ 60,000
      flightIncluded: true,
      flightCostPaise: 2800000, // ₹ 28,000
      flightNote: "Indigo Return Flights DEL-SXR with 20kg baggage",
      landNote: "Complete DMC Ground Package, luxury stays & private transfers",
    },
  };
  await saveItineraryData(itineraryId, existing);

  const clientView1 = computeClientView(existing);
  console.log("Computed Client View (Supplier Mode):");
  console.log("  - Final Price Rupees:", clientView1.pricing.finalPriceRupees);
  console.log("  - Rendered Items Count:", clientView1.pricing.items.length);
  clientView1.pricing.items.forEach((it, i) => {
    console.log(`    Item ${i + 1}: [${it.key}] ${it.title} -> ₹ ${it.amountFormatted} (${it.subtitle})`);
  });

  // Verify Supplier Mode Assertions
  if (clientView1.pricing.items.length !== 2) {
    throw new Error(`Expected exactly 2 items in Supplier Mode, got ${clientView1.pricing.items.length}`);
  }
  if (clientView1.pricing.finalPriceRupees !== 97000) {
    throw new Error(`Expected total ₹ 97,000, got ${clientView1.pricing.finalPriceRupees}`);
  }
  const hasMarkupWord = clientView1.pricing.items.some((it) => it.title.toLowerCase().includes("markup") || it.subtitle.toLowerCase().includes("markup"));
  if (hasMarkupWord) {
    throw new Error("Markup was leaked to client view!");
  }

  // -------------------------------------------------------------
  // Test Case 2: Custom Mode (Itemized Flight + Hotel + Land Part, Visa Excluded)
  // -------------------------------------------------------------
  console.log("\n[Test Case 2] Setting up Custom Itinerary...");
  existing.pricing = {
    ...existing.pricing,
    pricingType: "custom",
    gstMode: "inclusive",
    customBreakup: {
      flight: { included: true, amountPaise: 3000000, note: "Return Flight Tickets with 15kg check-in" },
      hotel: { included: true, amountPaise: 4000000, note: "5-Star Boutique Stay with Breakfast" },
      landPart: { included: true, amountPaise: 2000000, note: "Private AC Cab & Sightseeing" },
      visa: { included: false, amountPaise: 0, note: "" }, // EXCLUDED
    },
  };
  await saveItineraryData(itineraryId, existing);

  const clientView2 = computeClientView(existing);
  console.log("Computed Client View (Custom Mode):");
  console.log("  - Final Price Rupees:", clientView2.pricing.finalPriceRupees);
  console.log("  - Rendered Items Count:", clientView2.pricing.items.length);
  clientView2.pricing.items.forEach((it, i) => {
    console.log(`    Item ${i + 1}: [${it.key}] ${it.title} -> ₹ ${it.amountFormatted} (${it.subtitle})`);
  });

  // Verify Custom Mode Assertions
  if (clientView2.pricing.items.length !== 3) {
    throw new Error(`Expected exactly 3 items in Custom Mode, got ${clientView2.pricing.items.length}`);
  }
  if (clientView2.pricing.finalPriceRupees !== 90000) {
    throw new Error(`Expected total ₹ 90,000, got ${clientView2.pricing.finalPriceRupees}`);
  }
  const hasVisa = clientView2.pricing.items.some((it) => it.key === "visa" || it.title.toLowerCase().includes("visa"));
  if (hasVisa) {
    throw new Error("Excluded Visa item appeared in client items!");
  }

  // -------------------------------------------------------------
  // Test Case 3: Playwright Browser Capture of Editor and PDF Print
  // -------------------------------------------------------------
  console.log("\n[Test Case 3] Launching Playwright to capture Editor UI and PDF Print View...");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });

  // 3.A: Capture Editor Pricing Panel (Custom Mode)
  await page.goto(`http://localhost:3000/itineraries/${itineraryId}/edit`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  const editorPricingCard = await page.$("text=Package Pricing & Commercials");
  if (editorPricingCard) {
    await editorPricingCard.scrollIntoViewIfNeeded();
  }
  const editorScreenshotPath = path.join(process.cwd(), ".uploads", "audit", "pricing-panel-simplified.png");
  fs.mkdirSync(path.dirname(editorScreenshotPath), { recursive: true });
  await page.screenshot({ path: editorScreenshotPath, fullPage: false });
  console.log(`  -> Saved Editor Pricing Panel screenshot to: ${editorScreenshotPath}`);

  // 3.B: Capture PDF Print View for Custom Mode
  await page.goto(`http://localhost:3000/print/${itineraryId}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);

  // Check if "Not Included" appears anywhere in the price table
  const priceTableContent = await page.textContent("section.avoid-break");
  console.log("Price table text snippet:", priceTableContent?.slice(0, 300));

  const hasNotIncludedText = priceTableContent?.includes("Not Included") || priceTableContent?.includes("Excluded / On Actuals");
  if (hasNotIncludedText) {
    throw new Error("Price table still contains 'Not Included' or 'Excluded / On Actuals'!");
  } else {
    console.log("  -> SUCCESS: Price table contains ZERO 'Not Included' or 'Excluded' rows!");
  }

  const pdfScreenshotPath = path.join(process.cwd(), ".uploads", "audit", "pdf-price-table-custom-clean.png");
  await page.screenshot({ path: pdfScreenshotPath, fullPage: true });
  console.log(`  -> Saved PDF Print View screenshot to: ${pdfScreenshotPath}`);

  // 3.C: Switch to Supplier Mode and verify PDF Print View
  existing.pricing = {
    ...existing.pricing,
    pricingType: "supplier",
    markup: { type: "percent", value: 15 },
    gstMode: "inclusive",
    supplierBreakup: {
      supplierCostPaise: 6000000,
      flightIncluded: true,
      flightCostPaise: 2800000,
      flightNote: "Indigo Return Flights DEL-SXR with 20kg baggage",
      landNote: "Complete DMC Ground Package, luxury stays & private transfers",
    },
  };
  await saveItineraryData(itineraryId, existing);

  await page.goto(`http://localhost:3000/print/${itineraryId}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);

  const supplierPdfContent = await page.textContent("section.avoid-break");
  if (supplierPdfContent?.includes("Not Included") || supplierPdfContent?.includes("Excluded / On Actuals")) {
    throw new Error("Supplier price table contains 'Not Included'!");
  }
  if (supplierPdfContent?.toLowerCase().includes("markup")) {
    throw new Error("Supplier price table contains markup!");
  }

  const supplierPdfScreenshot = path.join(process.cwd(), ".uploads", "audit", "pdf-price-table-supplier-clean.png");
  await page.screenshot({ path: supplierPdfScreenshot, fullPage: true });
  console.log(`  -> Saved Supplier PDF screenshot to: ${supplierPdfScreenshot}`);

  await browser.close();

  console.log("\n=== ALL VERIFICATIONS PASSED 100%! ===");
}

runEndToEndVerification().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
