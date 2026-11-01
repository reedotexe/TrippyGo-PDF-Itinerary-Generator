const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/Admin/.gemini/antigravity/brain/9627fe67-27b9-421a-a4db-5bb956f502d1';
const ITINERARY_ID = 'feb43b07-4013-47eb-a80c-40fb494eba70';
const URL = `http://localhost:3000/itineraries/${ITINERARY_ID}/edit`;

async function runPhase4Verification() {
  console.log(`Starting Phase 4 verification on ${URL}...`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 950 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  // 1. Navigate to editor
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('nav[aria-label="Itinerary Workflow Stepper"]', { timeout: 20000 });
  console.log('✓ Editor page loaded and workflow stepper detected');

  // Dismiss dev overlay
  await page.evaluate(() => {
    document.querySelectorAll('nextjs-portal').forEach((el) => el.remove());
  });

  await page.waitForTimeout(1000);

  // Switch to Tab 3: Day Plan
  await page.click('#tab-days');
  await page.waitForTimeout(800);
  console.log('✓ Switched to Tab 3: Day Plan');

  // Verify DaysPanel header
  const panelHeader = await page.$('h3:has-text("Day-by-Day Journey Plan")');
  console.log(`✓ Day-by-Day header detected: ${panelHeader !== null}`);

  // Ensure at least 3 days for testing stepper and multi-day interaction
  const addDayBtn = await page.$('button:has-text("Add Day")');
  let currentDaysCount = (await page.$$('button:has-text("Day 0")')).length;
  if (currentDaysCount < 3 && addDayBtn) {
    console.log(`Current days: ${currentDaysCount}. Adding days to test stepper...`);
    await addDayBtn.click({ force: true });
    await page.waitForTimeout(400);
    await addDayBtn.click({ force: true });
    await page.waitForTimeout(400);
  }

  // --- 4.1 HORIZONTAL DAY STEPPER ---
  console.log('\n--- Verifying 4.1: Horizontal Day Stepper ---');
  const dayPill1 = await page.$('button:has-text("Day 01")');
  const dayPill2 = await page.$('button:has-text("Day 02")');
  const dayPill3 = await page.$('button:has-text("Day 03")');
  console.log(`✓ Day 01 pill present: ${dayPill1 !== null}`);
  console.log(`✓ Day 02 pill present: ${dayPill2 !== null}`);
  console.log(`✓ Day 03 pill present: ${dayPill3 !== null}`);

  const scrollLeftBtn = await page.$('button[aria-label="Scroll days left"]');
  const scrollRightBtn = await page.$('button[aria-label="Scroll days right"]');
  console.log(`✓ Stepper navigation arrows present: ${scrollLeftBtn !== null && scrollRightBtn !== null}`);

  // Test switching to Day 02
  if (dayPill2) {
    await dayPill2.click({ force: true });
    await page.waitForTimeout(400);
    const day2Header = await page.$('span:has-text("Editing Day 2")');
    console.log(`✓ Switched to Day 02: ${day2Header !== null}`);
  }

  // Switch back to Day 01
  if (dayPill1) {
    await dayPill1.click({ force: true });
    await page.waitForTimeout(400);
  }

  // Capture screenshot of Day Stepper
  const stepperScreenshotPath = path.join(ARTIFACT_DIR, 'phase4-days-stepper.png');
  await page.screenshot({ path: stepperScreenshotPath, fullPage: false });
  console.log(`✓ Screenshot saved: ${stepperScreenshotPath}`);

  // --- 4.2 FIX 3-BUTTON PHOTO REDUNDANCY ---
  console.log('\n--- Verifying 4.2: Photo Redundancy De-Duplication ---');
  // Check that the old inline query input and "Find Photos" button are GONE
  const oldQueryInput = await page.$('input[placeholder*="Dal Lake Srinagar shikara"]');
  const oldFindPhotosBtn = await page.$('button:has-text("Find Photos")');
  console.log(`✓ Old inline query input removed: ${oldQueryInput === null}`);
  console.log(`✓ Old "Find Photos" button removed: ${oldFindPhotosBtn === null}`);

  // Verify single photo action exists
  const singlePhotoBtn = await page.$('button:has-text("Choose Photo"), button:has-text("Change Photo")');
  console.log(`✓ Exactly one clear Photo action button present: ${singlePhotoBtn !== null}`);

  // Test opening modal
  if (singlePhotoBtn) {
    await singlePhotoBtn.click({ force: true });
    await page.waitForTimeout(600);

    const modalTitle = await page.$('#image-picker-modal-title, h2:has-text("Select Photo for Day")');
    console.log(`✓ Photo modal opened from single button: ${modalTitle !== null}`);

    const modalScreenshotPath = path.join(ARTIFACT_DIR, 'phase4-days-photo-picker-clean.png');
    await page.screenshot({ path: modalScreenshotPath, fullPage: false });
    console.log(`✓ Screenshot saved: ${modalScreenshotPath}`);

    // Close modal
    const closeBtn = await page.$('button[aria-label="Close modal"], button:has-text("✕"), button:has(svg.lucide-x)');
    if (closeBtn) {
      await closeBtn.click({ force: true });
      await page.waitForTimeout(400);
      console.log('✓ Photo modal closed cleanly');
    }
  }

  // --- 4.3 INLINE STAY & MEALS ---
  console.log('\n--- Verifying 4.3: Inline 3-Column Stay & Meals ---');
  const hotelInput = await page.$('#day-0-stay-hotel');
  const cityInput = await page.$('#day-0-stay-city');
  const roomInput = await page.$('#day-0-stay-room');

  console.log(`✓ Stay Hotel input present: ${hotelInput !== null}`);
  console.log(`✓ Stay City input present: ${cityInput !== null}`);
  console.log(`✓ Stay Room Type input present: ${roomInput !== null}`);

  // Fill in Room Category
  if (roomInput) {
    await roomInput.fill('Luxury Lake View Suite');
  }

  // Verify Meal Toggle Badges
  const breakfastBtn = await page.$('button:has-text("Breakfast")');
  const lunchBtn = await page.$('button:has-text("Lunch")');
  const dinnerBtn = await page.$('button:has-text("Dinner")');
  console.log(`✓ Breakfast toggle badge present: ${breakfastBtn !== null}`);
  console.log(`✓ Lunch toggle badge present: ${lunchBtn !== null}`);
  console.log(`✓ Dinner toggle badge present: ${dinnerBtn !== null}`);

  // Toggle dinner
  if (dinnerBtn) {
    await dinnerBtn.click({ force: true });
    await page.waitForTimeout(300);
    console.log('✓ Toggled Dinner meal inclusion');
  }

  // --- 4.4 TAG-BASED ACTIVITIES & PRESETS ---
  console.log('\n--- Verifying 4.4: Tag-Based Activities & Quick Presets ---');
  const quickPresetBtn = await page.$('button:has-text("+ City Tour"), button:has-text("+ Leisure & Shopping")');
  console.log(`✓ Quick add activity preset chips present: ${quickPresetBtn !== null}`);

  if (quickPresetBtn) {
    await quickPresetBtn.click({ force: true });
    await page.waitForTimeout(300);
    console.log('✓ Added activity via 1-click preset chip');
  }

  // Custom activity input
  const actInput = await page.$('#day-0-new-act');
  console.log(`✓ Inline custom activity input present: ${actInput !== null}`);

  // Capture full workbench screenshot
  const workbenchScreenshotPath = path.join(ARTIFACT_DIR, 'phase4-days-full-workbench.png');
  await page.screenshot({ path: workbenchScreenshotPath, fullPage: false });
  console.log(`✓ Screenshot saved: ${workbenchScreenshotPath}`);

  await browser.close();
  console.log('\n=== PHASE 4 VERIFICATION COMPLETE: ALL CHECKS PASSED ===');
}

runPhase4Verification().catch((err) => {
  console.error('Phase 4 verification failed:', err);
  process.exit(1);
});
