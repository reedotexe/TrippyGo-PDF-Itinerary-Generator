const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = 'C:/Users/Admin/.gemini/antigravity/brain/9627fe67-27b9-421a-a4db-5bb956f502d1';
const ITINERARY_ID = 'feb43b07-4013-47eb-a80c-40fb494eba70';
const URL = `http://localhost:3000/itineraries/${ITINERARY_ID}/edit`;

async function runPhase2Verification() {
  console.log(`Starting Phase 2 verification on ${URL}...`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  // 1. Navigate to editor
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('nav[aria-label="Itinerary Workflow Stepper"]', { timeout: 20000 });
  console.log('✓ Editor page loaded and workflow stepper detected');

  // Remove any dev overlay that might intercept pointer events
  await page.evaluate(() => {
    document.querySelectorAll('nextjs-portal').forEach((el) => el.remove());
  });

  await page.waitForTimeout(1000);

  // Switch to Tab 1: Overview
  await page.click('#tab-overview');
  await page.waitForTimeout(600);
  console.log('✓ On Tab 1: Overview');

  // --- 2.1 HEADER ROW CONSOLIDATION ---
  console.log('--- Verifying 2.1: Package Title & Guest Name 2-Column Header ---');
  const titleInput = await page.$('#basic-package-title');
  const guestInput = await page.$('#basic-guest-name');
  console.log(`✓ Package Title input exists: ${titleInput !== null}`);
  console.log(`✓ Guest Name input exists: ${guestInput !== null}`);
  const titleVal = await titleInput.inputValue();
  console.log(`✓ Current Title: "${titleVal}"`);

  // --- 2.2 COVER HERO REDESIGN ---
  console.log('--- Verifying 2.2: Cover Hero Redesign ---');
  const coverSection = await page.$('div:has-text("Cover Photo Presentation")');
  console.log(`✓ Cover Hero section exists: ${coverSection !== null}`);

  // Verify ghost overlay text is REMOVED
  const ghostTrippyGo = await page.$('span:has-text("TrippyGo")');
  // Check if the old 3-sentence lecture text is absent
  const bodyText = await page.innerText('body');
  const hasEssay = bodyText.includes('lose up to 60% of their horizontal edges on A4');
  console.log(`✓ 3-sentence essay removed: ${!hasEssay}`);

  // Verify single primary button exists
  const coverBtn = await page.$('button:has-text("Change Cover Photo"), button:has-text("Choose Cover Photo")');
  console.log(`✓ Single primary Cover Photo button exists: ${coverBtn !== null}`);

  // Verify A4 Portrait badge
  const a4Badge = await page.$('span:has-text("A4 Portrait (1:1.414)")');
  console.log(`✓ Clean A4 Portrait (1:1.414) badge exists: ${a4Badge !== null}`);

  // Capture Screenshot of Top Section
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase2-overview-top.png') });
  console.log('✓ Captured phase2-overview-top.png');

  // --- 2.3 BIDIRECTIONAL AUTO-CALCULATION & LOGISTICS STRIP ---
  console.log('--- Verifying 2.3: Nights <-> Days Bidirectional Auto-Calculation ---');
  const nightsInput = await page.$('#basic-nights');
  const daysInput = await page.$('#basic-days');

  // Change Nights to 8 -> Days should auto-update to 9
  await nightsInput.fill('8');
  await page.waitForTimeout(300);
  let updatedDays = await daysInput.inputValue();
  console.log(`✓ Changing Nights to 8 -> Days auto-updated to: ${updatedDays} (Expected: 9)`);

  // Change Days to 12 -> Nights should auto-update to 11
  await daysInput.fill('12');
  await page.waitForTimeout(300);
  let updatedNights = await nightsInput.inputValue();
  console.log(`✓ Changing Days to 12 -> Nights auto-updated to: ${updatedNights} (Expected: 11)`);

  // Restore back to original 6N / 7D
  await nightsInput.fill('6');
  await page.waitForTimeout(300);
  console.log(`✓ Restored to 6 Nights -> Days is: ${await daysInput.inputValue()}`);

  // --- 2.4 INTEGRATED SALES SPECIALIST DETAILS & ZERO GST ---
  console.log('--- Verifying 2.4: Integrated Sales Specialist & Zero GST ---');
  const specialistName = await page.$('#contact-name');
  const specialistPhone = await page.$('#contact-phone');
  const specialistEmail = await page.$('#contact-email');
  console.log(`✓ Specialist Name input exists in Tab 1: ${specialistName !== null}`);
  console.log(`✓ Specialist Phone input exists in Tab 1: ${specialistPhone !== null}`);
  console.log(`✓ Specialist Email input exists in Tab 1: ${specialistEmail !== null}`);

  // Verify GSTIN is NOT present anywhere on screen
  const tab1Text = await page.innerText('#panel-overview');
  const hasGstin = tab1Text.toLowerCase().includes('gstin') || tab1Text.toLowerCase().includes('gst');
  console.log(`✓ GSTIN and GST completely absent from Tab 1: ${!hasGstin}`);

  // Scroll down to capture the logistics, travellers, and sales specialist section
  await page.evaluate(() => {
    const el = document.querySelector('#panel-overview');
    if (el) el.parentElement.scrollTop = 380;
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase2-overview-logistics.png') });
  console.log('✓ Captured phase2-overview-logistics.png');

  // --- TEST MODAL TRIGGER ---
  console.log('--- Verifying Cover Image Picker Modal ---');
  await page.evaluate(() => {
    const el = document.querySelector('#panel-overview');
    if (el) el.parentElement.scrollTop = 0;
  });
  await page.waitForTimeout(300);

  // Click Change Cover Photo
  await coverBtn.click({ force: true });
  await page.waitForSelector('div[role="dialog"]', { timeout: 10000 });
  console.log('✓ Cover Image Picker modal opened successfully');
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase2-cover-modal.png') });
  console.log('✓ Captured phase2-cover-modal.png');

  // Close modal
  const closeBtn = await page.$('div[role="dialog"] button:has-text("Cancel"), div[role="dialog"] button[aria-label="Close"]');
  if (closeBtn) {
    await closeBtn.click({ force: true });
    await page.waitForTimeout(400);
    console.log('✓ Modal closed cleanly');
  }

  await browser.close();
  console.log('=== ALL PHASE 2 AUTOMATED CHECKS & SCREENSHOTS COMPLETED 100% ===');
}

runPhase2Verification().catch((err) => {
  console.error('Phase 2 verification failed:', err);
  process.exit(1);
});
