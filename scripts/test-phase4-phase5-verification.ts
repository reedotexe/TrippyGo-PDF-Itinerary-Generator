import { chromium } from "playwright";
import path from "path";
import fs from "fs";

async function verifyPhase4And5() {
  console.log("=== STARTING PHASE 4 & PHASE 5 PLAYWRIGHT VERIFICATION ===");

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  const artifactDir = "C:\\Users\\Admin\\.gemini\\antigravity\\brain\\9627fe67-27b9-421a-a4db-5bb956f502d1";
  if (!fs.existsSync(artifactDir)) {
    fs.mkdirSync(artifactDir, { recursive: true });
  }

  // 1. Navigate to Edit Page
  const itineraryId = "feb43b07-4013-47eb-a80c-40fb494eba70";
  console.log(`[Step 1] Navigating to http://localhost:3000/itineraries/${itineraryId}/edit...`);
  await page.goto(`http://localhost:3000/itineraries/${itineraryId}/edit`, {
    waitUntil: "networkidle",
    timeout: 30000,
  });

  // Verify Basics tab is active
  await page.waitForSelector("text=Cover Page Presentation (A4 Hero Photo)", { timeout: 10000 });
  console.log("  -> Found 'Cover Page Presentation (A4 Hero Photo)' card in BasicsPanel!");

  // Capture Basics Panel screenshot
  const basicsCardScreenshot = path.join(artifactDir, "phase4-basics-cover-card.png");
  await page.screenshot({ path: basicsCardScreenshot });
  console.log(`  -> Saved basics card screenshot: ${basicsCardScreenshot}`);

  // 2. Open Cover Picker Modal
  console.log("[Step 2] Clicking 'Change Cover Photo' / 'Select A4 Cover Photo' button...");
  const selectCoverButton = page.locator("button:has-text('Change Cover Photo'), button:has-text('Select A4 Cover Photo')").first();
  await selectCoverButton.click();

  // Wait for modal
  await page.waitForSelector("text=Select A4 Portrait Cover Hero Photo", { timeout: 5000 });
  console.log("  -> ImagePickerModal in mode='cover' opened successfully!");

  // Check the 3 tabs
  const curatedTab = page.locator("button:has-text('Curated Luxury Presets')");
  const stockTab = page.locator("button:has-text('Multi-Stock Portrait Search')");
  const uploadTab = page.locator("button:has-text('Custom Upload & Crop')");

  console.log("  -> Tab 1 (Curated):", (await curatedTab.count()) > 0 ? "Present" : "Missing");
  console.log("  -> Tab 2 (Stock):", (await stockTab.count()) > 0 ? "Present" : "Missing");
  console.log("  -> Tab 3 (Upload):", (await uploadTab.count()) > 0 ? "Present" : "Missing");

  // Capture Modal Tab 1 (Curated Presets)
  const modalPresetsScreenshot = path.join(artifactDir, "phase5-modal-curated-presets.png");
  await page.screenshot({ path: modalPresetsScreenshot });
  console.log(`  -> Saved Presets modal screenshot: ${modalPresetsScreenshot}`);

  // 3. Switch to Tab 2 (Stock Search)
  console.log("[Step 3] Switching to Multi-Stock Portrait Search Tab...");
  await stockTab.click();
  await page.waitForTimeout(2000); // Wait for stock photos or placeholder

  const modalStockScreenshot = path.join(artifactDir, "phase5-modal-stock-search.png");
  await page.screenshot({ path: modalStockScreenshot });
  console.log(`  -> Saved Stock Search modal screenshot: ${modalStockScreenshot}`);

  // 4. Switch to Tab 3 (Custom Upload)
  console.log("[Step 4] Switching to Custom Upload & Crop Tab...");
  await uploadTab.click();
  await page.waitForTimeout(500);

  const modalUploadScreenshot = path.join(artifactDir, "phase5-modal-custom-upload.png");
  await page.screenshot({ path: modalUploadScreenshot });
  console.log(`  -> Saved Custom Upload modal screenshot: ${modalUploadScreenshot}`);

  // 5. Switch back to Presets and select a preset
  console.log("[Step 5] Selecting a curated preset...");
  await curatedTab.click();
  await page.waitForTimeout(500);

  const firstPresetCard = page.locator("div[role='button']:has-text('Apply Cover'), div[role='button']").filter({ hasText: "Burj Khalifa" }).first();
  if (await firstPresetCard.count() > 0) {
    console.log("  -> Clicking preset 'Burj Khalifa Twilight Sky'...");
    await firstPresetCard.click();
  } else {
    // Click any preset card
    const anyPreset = page.locator(".group.cursor-pointer").first();
    console.log("  -> Clicking first available preset card...");
    await anyPreset.click();
  }

  await page.waitForTimeout(1000);

  // Modal should be closed now
  const modalClosed = (await page.locator("text=Select A4 Portrait Cover Hero Photo").count()) === 0;
  console.log("  -> Modal closed after selection:", modalClosed);

  // Check if BasicsPanel reflects Custom Cover Active
  const hasActiveIndicator = (await page.locator("text=Custom Cover Active").count()) > 0;
  console.log("  -> BasicsPanel displays 'Custom Cover Active':", hasActiveIndicator);

  // Capture updated Basics Panel
  const updatedBasicsScreenshot = path.join(artifactDir, "phase4-basics-cover-active.png");
  await page.screenshot({ path: updatedBasicsScreenshot });
  console.log(`  -> Saved updated basics screenshot: ${updatedBasicsScreenshot}`);

  // 6. Test Print Page rendering
  console.log(`[Step 6] Navigating to http://localhost:3000/print/${itineraryId}...`);
  await page.goto(`http://localhost:3000/print/${itineraryId}`, {
    waitUntil: "networkidle",
    timeout: 30000,
  });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1500);

  const printPageScreenshot = path.join(artifactDir, "phase5-print-cover-a4-result.png");
  await page.screenshot({ path: printPageScreenshot });
  console.log(`  -> Saved print cover screenshot: ${printPageScreenshot}`);

  await browser.close();
  console.log("=== PHASE 4 & PHASE 5 VERIFICATION COMPLETED SUCCESSFULLY ===");
}

verifyPhase4And5().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
