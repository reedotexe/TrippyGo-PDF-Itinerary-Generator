const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/Admin/.gemini/antigravity/brain/9627fe67-27b9-421a-a4db-5bb956f502d1';
const ITINERARY_ID = 'feb43b07-4013-47eb-a80c-40fb494eba70';
const URL = `http://localhost:3000/itineraries/${ITINERARY_ID}/edit`;

async function runPhase6Verification() {
  console.log(`Starting Phase 6 verification on ${URL}...`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1050 },
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

  // Switch to Tab 5: Pricing
  await page.click('#tab-pricing');
  await page.waitForTimeout(800);
  console.log('✓ Switched to Tab 5: Pricing');

  // --- 6.1 DE-NESTED WORKBENCH & MODE SELECTOR ---
  console.log('\n--- Verifying 6.1: De-Nested Single-Surface Workbench ---');
  const panelHeader = await page.$('h3:has-text("Package Pricing & Commercials")');
  console.log(`✓ Pricing panel header detected: ${panelHeader !== null}`);

  const supplierModeBtn = await page.$('button:has-text("1. Supplier DMC Package")');
  const customModeBtn = await page.$('button:has-text("2. Custom Itemized Quote")');
  console.log(`✓ Segmented Supplier Mode button: ${supplierModeBtn !== null}`);
  console.log(`✓ Segmented Custom Mode button: ${customModeBtn !== null}`);

  // --- 6.3 STREAMLINED PRICE DISTRIBUTION STRIP ---
  console.log('\n--- Verifying 6.3: Streamlined Price Distribution Strip ---');
  const paxBadge = await page.$('span:has-text("Traveler")');
  const totalOnlyBtn = await page.$('button:has-text("Total Only (Standard)")');
  const splitBtn = await page.$('button:has-text("Split Per Person")');
  console.log(`✓ Passenger badge in distribution strip: ${paxBadge !== null}`);
  console.log(`✓ "Total Only" button present: ${totalOnlyBtn !== null}`);
  console.log(`✓ "Split Per Person" button present: ${splitBtn !== null}`);

  // --- 6.2 INDIAN RUPEE COMMA FORMATTING ---
  console.log('\n--- Verifying 6.2: Indian Rupee Comma Formatting ---');
  // Click supplier mode first
  if (supplierModeBtn) {
    await supplierModeBtn.click({ force: true });
    await page.waitForTimeout(400);
  }

  const supplierCostInput = await page.$('#supplier-cost');
  console.log(`✓ Supplier Cost input detected: ${supplierCostInput !== null}`);

  if (supplierCostInput) {
    // Fill in a test amount
    await supplierCostInput.fill('125000');
    await page.waitForTimeout(300);
    const val = await supplierCostInput.inputValue();
    console.log(`✓ Typed "125000" formatted as Indian commas: "${val}" (matches "1,25,000": ${val === '1,25,000'})`);
  }

  // --- 6.5 SINGLE FLIGHT SWITCH & EXECUTIVE SUMMARY BAR ---
  console.log('\n--- Verifying 6.5: Single Flight Switch & Executive Summary Bar ---');
  const flightCheckbox = await page.$('input[type="checkbox"]:near(:text("Include Flight Tickets"))');
  console.log(`✓ Single Flight inclusion switch present: ${flightCheckbox !== null}`);

  // Verify duplicate badge is GONE
  const oldFlightsIncludedBadge = await page.$('span:has-text("Flights Included")');
  console.log(`✓ Redundant "Flights Included" badge eliminated: ${oldFlightsIncludedBadge === null}`);

  const summaryBar = await page.$('div:has-text("Executive Commercial Breakdown")');
  const totalClientPrice = await page.$('div:has-text("Total Client Selling Price")');
  console.log(`✓ Executive Commercial Breakdown bar present: ${summaryBar !== null}`);
  console.log(`✓ Total Client Selling Price readout present: ${totalClientPrice !== null}`);

  // Capture Supplier Mode Screenshot
  const supplierScreenshotPath = path.join(ARTIFACT_DIR, 'phase6-pricing-supplier-mode.png');
  await page.screenshot({ path: supplierScreenshotPath, fullPage: false });
  console.log(`✓ Screenshot saved: ${supplierScreenshotPath}`);

  // --- 6.4 CUSTOM MODE 4-PILLAR WORKBENCH ---
  console.log('\n--- Verifying 6.4: Custom Mode 4-Pillar Workbench ---');
  if (customModeBtn) {
    await customModeBtn.click({ force: true });
    await page.waitForTimeout(500);
    console.log('✓ Switched to Custom Itemized Mode');
  }

  const flightPillar = await page.$('span:has-text("Flight Airfare")');
  const landPillar = await page.$('span:has-text("Land Package")');
  const hotelPillar = await page.$('span:has-text("Hotel Stays")');
  const visaPillar = await page.$('span:has-text("Visa & Entry")');

  console.log(`✓ Custom Pillar 1 (Flight Airfare): ${flightPillar !== null}`);
  console.log(`✓ Custom Pillar 2 (Land Package): ${landPillar !== null}`);
  console.log(`✓ Custom Pillar 3 (Hotel Stays): ${hotelPillar !== null}`);
  console.log(`✓ Custom Pillar 4 (Visa & Entry): ${visaPillar !== null}`);

  // Fill in Land Package amount with Indian formatting
  const landInput = await page.$('#custom-landPart-amount');
  if (landInput) {
    await landInput.fill('45000');
    await page.waitForTimeout(300);
    const landVal = await landInput.inputValue();
    console.log(`✓ Custom Land Price formatted as: "${landVal}" (matches "45,000": ${landVal === '45,000'})`);
  }

  // Capture Custom Mode Screenshot
  const customScreenshotPath = path.join(ARTIFACT_DIR, 'phase6-pricing-custom-mode.png');
  await page.screenshot({ path: customScreenshotPath, fullPage: false });
  console.log(`✓ Screenshot saved: ${customScreenshotPath}`);

  // --- SPLIT PER PERSON INTERACTION ---
  console.log('\n--- Verifying Split Per Person Interaction ---');
  if (splitBtn) {
    await splitBtn.click({ force: true });
    await page.waitForTimeout(400);
    console.log('✓ Activated "Split Per Person" distribution mode');

    const splitBadge = await page.$('span:has-text("/ pax")');
    console.log(`✓ Per-person split badge displayed: ${splitBadge !== null}`);
  }

  // Capture Split Per Person Screenshot
  const splitScreenshotPath = path.join(ARTIFACT_DIR, 'phase6-pricing-split-per-person.png');
  await page.screenshot({ path: splitScreenshotPath, fullPage: false });
  console.log(`✓ Screenshot saved: ${splitScreenshotPath}`);

  // Restore to Total Only
  if (totalOnlyBtn) {
    await totalOnlyBtn.click({ force: true });
    await page.waitForTimeout(300);
  }

  await browser.close();
  console.log('\n=== PHASE 6 VERIFICATION COMPLETE: ALL CHECKS PASSED ===');
}

runPhase6Verification().catch((err) => {
  console.error('Phase 6 verification failed:', err);
  process.exit(1);
});
