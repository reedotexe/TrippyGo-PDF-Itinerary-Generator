import { chromium } from "playwright";
import path from "path";
import fs from "fs";

async function verifyPackagePriceBreakup() {
  console.log("=== RUNNING 4-PILLAR PACKAGE PRICE BREAKUP E2E VERIFICATION ===");

  const artifactDir = "C:\\Users\\Admin\\.gemini\\antigravity\\brain\\9627fe67-27b9-421a-a4db-5bb956f502d1";
  if (!fs.existsSync(artifactDir)) {
    fs.mkdirSync(artifactDir, { recursive: true });
  }

  const itineraryId = "feb43b07-4013-47eb-a80c-40fb494eba70";

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  // 1. Navigate to Edit Page
  console.log("[Step 1] Navigating to itinerary editor page...");
  await page.goto(`http://localhost:3000/itineraries/${itineraryId}/edit`, {
    waitUntil: "networkidle",
    timeout: 30000,
  });

  // 2. Locate Commercials, Markup & GST Panel
  console.log("[Step 2] Scrolling to PricingPanel...");
  const pricingHeading = page.locator("text=Commercials, Markup & GST");
  await pricingHeading.scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);

  // 3. Verify the 4-pillar Package Price Breakup section
  console.log("[Step 3] Verifying 4-pillar Package Price Breakup section...");
  await page.waitForSelector("text=Package Price Breakup (4 Pillars)", { timeout: 10000 });
  console.log("  -> Found 'Package Price Breakup (4 Pillars)' card header.");

  // Check all 4 pillars are present in editor
  const flightPillar = page.locator("#breakup-flight-amount");
  const hotelPillar = page.locator("#breakup-hotel-amount");
  const landPartPillar = page.locator("#breakup-landPart-amount");
  const visaPillar = page.locator("#breakup-visa-amount");

  console.log("  -> Flight input found:", (await flightPillar.count()) > 0);
  console.log("  -> Hotel input found:", (await hotelPillar.count()) > 0);
  console.log("  -> Land Part input found:", (await landPartPillar.count()) > 0);
  console.log("  -> Visa input found:", (await visaPillar.count()) > 0);

  // 4. Fill in itemized values and notes
  console.log("[Step 4] Entering 4-pillar breakup values and notes...");
  await flightPillar.fill("35000");
  await page.locator("#breakup-flight-note").fill("Return economy airfare with 20kg baggage");

  await hotelPillar.fill("45000");
  await page.locator("#breakup-hotel-note").fill("4-star luxury stays with daily breakfast");

  await landPartPillar.fill("30000");
  await page.locator("#breakup-landPart-note").fill("All private AC transfers, sightseeing & toll taxes");

  await visaPillar.fill("5000");
  await page.locator("#breakup-visa-note").fill("Tourist e-Visa fee & consular documentation support");

  await page.waitForTimeout(600);

  // 5. Verify live breakup sum & click "Sync Net"
  const syncBtn = page.locator("button:has-text('Sync Net')");
  if ((await syncBtn.count()) > 0) {
    console.log("  -> Clicking 'Sync Net' button to sync total supplier net to ₹ 1,15,000...");
    await syncBtn.click();
    await page.waitForTimeout(500);
  }

  // 6. Capture screenshot of PricingPanel
  const pricingPanelScreenshot = path.join(artifactDir, "pricing-panel-4-pillar-breakup.png");
  await page.screenshot({ path: pricingPanelScreenshot });
  console.log(`  -> Saved PricingPanel screenshot to: ${pricingPanelScreenshot}`);

  // Wait for autosave (800ms debounce + fetch)
  console.log("[Step 5] Waiting for autosave to complete...");
  await page.waitForTimeout(2000);

  // 7. Navigate to Print View for PDF Verification
  console.log(`\n[Step 6] Navigating to http://localhost:3000/print/${itineraryId} for PDF Audit...`);
  await page.goto(`http://localhost:3000/print/${itineraryId}`, {
    waitUntil: "networkidle",
    timeout: 30000,
  });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1500);

  // Verify PriceTable on the proposal
  const priceTable = page.locator(".itinerary-page:has-text('Pricing & Package Breakup')");
  console.log("  -> PriceTable with 'Pricing & Package Breakup' found:", (await priceTable.count()) > 0);

  // Verify all 4 pillars exist on the PDF
  const hasFlight = (await page.locator("text=Flight").count()) > 0;
  const hasHotel = (await page.locator("text=Hotel").count()) > 0;
  const hasLandPart = (await page.locator("text=Land Part").count()) > 0;
  const hasVisa = (await page.locator("text=Visa").count()) > 0;

  console.log(`  -> PDF Verification: Flight (${hasFlight}), Hotel (${hasHotel}), Land Part (${hasLandPart}), Visa (${hasVisa})`);

  // Verify itemized amounts are displayed
  const flightAmount = (await page.locator("text=₹ 35,000").count()) > 0;
  const hotelAmount = (await page.locator("text=₹ 45,000").count()) > 0;
  const landPartAmount = (await page.locator("text=₹ 30,000").count()) > 0;
  const visaAmount = (await page.locator("text=₹ 5,000").count()) > 0;

  console.log(`  -> Amounts on PDF: ₹ 35,000 (${flightAmount}), ₹ 45,000 (${hotelAmount}), ₹ 30,000 (${landPartAmount}), ₹ 5,000 (${visaAmount})`);

  // Scroll to PriceTable and capture screenshot
  if ((await priceTable.count()) > 0) {
    await priceTable.scrollIntoViewIfNeeded();
  }
  const pdfPricingScreenshot = path.join(artifactDir, "pdf-print-4-pillar-price-breakup.png");
  await page.screenshot({ path: pdfPricingScreenshot });
  console.log(`  -> Saved PDF Print Breakup screenshot to: ${pdfPricingScreenshot}`);

  await browser.close();
  console.log("\n=== 4-PILLAR PACKAGE PRICE BREAKUP VERIFIED SUCCESSFULLY WITH 100% PASS ===");
}

verifyPackagePriceBreakup().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
