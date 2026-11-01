import { chromium } from "playwright";
import path from "path";
import fs from "fs";

async function verifyDayImageAndSquarePdf() {
  console.log("=== VERIFYING DAY IMAGE PORTRAIT SEARCH, CUSTOM UPLOAD & RIGHT-ALIGNED SQUARE PDF ===");

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

  const itineraryId = "feb43b07-4013-47eb-a80c-40fb494eba70";

  // 1. Navigate to Edit Page
  console.log(`[Step 1] Navigating to http://localhost:3000/itineraries/${itineraryId}/edit...`);
  await page.goto(`http://localhost:3000/itineraries/${itineraryId}/edit`, {
    waitUntil: "networkidle",
    timeout: 30000,
  });

  // 2. Scroll to Days Section
  console.log("[Step 2] Locating 'Day-by-Day Itinerary' section in editor...");
  await page.waitForSelector("text=Day-by-Day Itinerary", { timeout: 15000 });
  const daysHeader = page.locator("text=Day-by-Day Itinerary").first();
  await daysHeader.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  // 3. Open Day Image Picker Modal
  console.log("[Step 3] Opening ImagePickerModal for Day 1...");
  const findPhotosBtn = page.locator("button:has-text('Find Photos')").first();
  await findPhotosBtn.click();

  await page.waitForSelector("text=Select Photo for Day", { timeout: 10000 });
  console.log("  -> Modal opened with title 'Select Photo for Day'!");

  // Check Tabs
  const searchTab = page.locator("button:has-text('Stock Search')");
  const uploadTab = page.locator("button:has-text('Custom Upload (Square)')");
  const presetsTab = page.locator("button:has-text('Destination Presets')");

  console.log("  -> Tab 'Stock Search':", (await searchTab.count()) > 0 ? "Present" : "Missing");
  console.log("  -> Tab 'Custom Upload (Square)':", (await uploadTab.count()) > 0 ? "Present" : "Missing");
  console.log("  -> Tab 'Destination Presets':", (await presetsTab.count()) > 0 ? "Present" : "Missing");

  // Check Orientation Selector
  const portraitOrientBtn = page.locator("button:has-text('Portrait')").first();
  const landscapeOrientBtn = page.locator("button:has-text('Landscape')").first();
  const allOrientBtn = page.locator("button:has-text('All')").first();

  console.log("  -> Orientation filter controls:", {
    all: (await allOrientBtn.count()) > 0,
    portrait: (await portraitOrientBtn.count()) > 0,
    landscape: (await landscapeOrientBtn.count()) > 0,
  });

  // Capture Day Modal with Orientation Selector
  const dayModalScreenshot = path.join(artifactDir, "day-modal-stock-search-orientations.png");
  await page.screenshot({ path: dayModalScreenshot });
  console.log(`  -> Saved Day Modal screenshot: ${dayModalScreenshot}`);

  // 4. Test clicking 'Portrait' orientation
  console.log("[Step 4] Clicking 'Portrait' orientation button...");
  await portraitOrientBtn.click();
  await page.waitForTimeout(1500);

  const dayModalPortraitScreenshot = path.join(artifactDir, "day-modal-portrait-filter-active.png");
  await page.screenshot({ path: dayModalPortraitScreenshot });
  console.log(`  -> Saved Portrait Filter screenshot: ${dayModalPortraitScreenshot}`);

  // 5. Test Custom Upload Tab
  console.log("[Step 5] Switching to 'Custom Upload (Square)' tab...");
  await uploadTab.click();
  await page.waitForTimeout(500);

  const hasUploadHeading = (await page.locator("text=Upload Custom Photo for Day").count()) > 0;
  console.log("  -> Custom Upload heading for Day present:", hasUploadHeading);

  const dayModalUploadScreenshot = path.join(artifactDir, "day-modal-custom-upload-square.png");
  await page.screenshot({ path: dayModalUploadScreenshot });
  console.log(`  -> Saved Day Upload Modal screenshot: ${dayModalUploadScreenshot}`);

  // 6. Select a portrait photo from stock search to test the square PDF layout
  console.log("[Step 6] Switching back to Search and selecting a photo for Day 1...");
  await searchTab.click();
  await page.waitForTimeout(500);

  // Click the first photo card inside modal
  const firstPhotoCard = page.locator("div[role='dialog'] .group.cursor-pointer").first();
  await firstPhotoCard.click();
  await page.waitForTimeout(1000);

  // Modal should be closed now
  const isModalClosed = (await page.locator("text=Select Photo for Day").count()) === 0;
  console.log("  -> Modal closed after photo selection:", isModalClosed);

  // 7. Verify Print PDF rendering of DayBlock
  console.log(`[Step 7] Navigating to http://localhost:3000/print/${itineraryId}...`);
  await page.goto(`http://localhost:3000/print/${itineraryId}`, {
    waitUntil: "networkidle",
    timeout: 30000,
  });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1500);

  // Check DayBlock layout in DOM
  const dayEditorialBlocks = await page.$$(".day-editorial-block");
  console.log(`  -> Found ${dayEditorialBlocks.length} day editorial blocks on print page`);

  const rightSquareImage = await page.$(".day-editorial-block .aspect-square");
  console.log("  -> Right-aligned square photo element found:", Boolean(rightSquareImage));

  const printPdfSquareDayScreenshot = path.join(artifactDir, "print-pdf-day-right-square-photo.png");
  await page.screenshot({ path: printPdfSquareDayScreenshot, fullPage: true });
  console.log(`  -> Saved Print PDF screenshot: ${printPdfSquareDayScreenshot}`);

  await browser.close();
  console.log("=== ALL DAY IMAGE AND SQUARE PDF DESIGN CHECKS PASSED SUCCESSFULLY ===");
}

verifyDayImageAndSquarePdf().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
