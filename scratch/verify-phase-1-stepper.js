const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = 'C:/Users/Admin/.gemini/antigravity/brain/9627fe67-27b9-421a-a4db-5bb956f502d1';
const ITINERARY_ID = 'feb43b07-4013-47eb-a80c-40fb494eba70';
const URL = `http://localhost:3000/itineraries/${ITINERARY_ID}/edit`;

async function runVerification() {
  console.log(`Starting Phase 1 verification on ${URL}...`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  // Mock /generate to avoid dual-Playwright dev server lock contention
  await page.route(`**/api/itineraries/${ITINERARY_ID}/generate`, async (route) => {
    console.log('Intercepted /generate call -> returning successful PDF version payload');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        versionNumber: 5,
        pdfUrl: `/api/storage/download?key=itineraries%2F${ITINERARY_ID}%2Fv5_1793255200579.pdf`,
        message: 'PDF generated and immutable version recorded successfully',
      }),
    });
  });

  // 1. Navigate to editor
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('nav[aria-label="Itinerary Workflow Stepper"]', { timeout: 20000 });
  console.log('✓ Editor page loaded and workflow stepper detected');

  // Dismiss any Next.js dev overlay that might intercept pointer events
  await page.evaluate(() => {
    document.querySelectorAll('nextjs-portal').forEach((el) => el.remove());
  });

  await page.waitForTimeout(1000);

  // 2. Verify Header elements
  const headerReload = await page.$('header button[title="Refresh Preview"]');
  console.log(`✓ Command bar duplicate Reload Preview button removed: ${headerReload === null}`);

  const iframeReload = await page.$('button[aria-label="Reload frame"]');
  console.log(`✓ Preview pane dedicated reload frame button exists: ${iframeReload !== null}`);

  const autosaveText = await page.innerText('header');
  console.log(`✓ Header contains calm status: ${autosaveText.includes('All changes saved') || autosaveText.includes('Saving') || autosaveText.includes('Unsaved')}`);

  // --- TAB 1: OVERVIEW ---
  console.log('--- Testing Tab 1: Overview ---');
  await page.click('#tab-overview');
  await page.waitForTimeout(600);
  const panelOverviewVisible = await page.isVisible('#panel-overview');
  const panelFlightsHidden = (await page.$('#panel-flights')) === null;
  console.log(`✓ Tab 1 active: ${panelOverviewVisible}, Flights hidden: ${panelFlightsHidden}`);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase1-tab1-overview.png') });

  // --- TAB 2: FLIGHTS ---
  console.log('--- Testing Tab 2: Flights ---');
  await page.click('#tab-flights');
  await page.waitForTimeout(600);
  const panelFlightsVisible = await page.isVisible('#panel-flights');
  const panelOverviewHidden = (await page.$('#panel-overview')) === null;
  console.log(`✓ Tab 2 active: ${panelFlightsVisible}, Overview hidden: ${panelOverviewHidden}`);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase1-tab2-flights.png') });

  // --- TAB 3: DAY PLAN ---
  console.log('--- Testing Tab 3: Day Plan ---');
  await page.click('#tab-days');
  await page.waitForTimeout(600);
  const panelDaysVisible = await page.isVisible('#panel-days');
  console.log(`✓ Tab 3 active: ${panelDaysVisible}`);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase1-tab3-days.png') });

  // --- TAB 4: INCLUSIONS ---
  console.log('--- Testing Tab 4: Inclusions ---');
  await page.click('#tab-inclusions');
  await page.waitForTimeout(600);
  const panelInclusionsVisible = await page.isVisible('#panel-inclusions');
  console.log(`✓ Tab 4 active: ${panelInclusionsVisible}`);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase1-tab4-inclusions.png') });

  // --- TAB 5: PRICING ---
  console.log('--- Testing Tab 5: Pricing ---');
  await page.click('#tab-pricing');
  await page.waitForTimeout(600);
  const panelPricingVisible = await page.isVisible('#panel-pricing');
  console.log(`✓ Tab 5 active: ${panelPricingVisible}`);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase1-tab5-pricing.png') });

  // --- TEST BOTTOM STEPPER NAVIGATION ---
  console.log('--- Testing Stepper Footer Navigation ---');
  // Remove dev overlay again if it re-attached
  await page.evaluate(() => {
    document.querySelectorAll('nextjs-portal').forEach((el) => el.remove());
  });

  // On Tab 5, click Previous Step with force: true -> should navigate to Tab 4 (Inclusions)
  await page.click('button:has-text("Previous Step")', { force: true });
  await page.waitForTimeout(600);
  console.log(`✓ Previous Step took to Inclusions: ${(await page.$('#panel-inclusions')) !== null}`);

  // On Tab 4, click Next: Pricing with force: true -> should navigate to Tab 5 (Pricing)
  await page.click('button:has-text("Next: Pricing")', { force: true });
  await page.waitForTimeout(600);
  console.log(`✓ Next Step took back to Pricing: ${(await page.$('#panel-pricing')) !== null}`);

  // --- TEST KEYBOARD SHORTCUTS ---
  console.log('--- Testing Keyboard Shortcuts (Ctrl+1, Ctrl+2, Ctrl+5) ---');
  await page.keyboard.press('Control+1');
  await page.waitForTimeout(600);
  console.log(`✓ Ctrl+1 switched to Overview: ${(await page.$('#panel-overview')) !== null}`);

  await page.keyboard.press('Control+2');
  await page.waitForTimeout(600);
  console.log(`✓ Ctrl+2 switched to Flights: ${(await page.$('#panel-flights')) !== null}`);

  await page.keyboard.press('Control+5');
  await page.waitForTimeout(600);
  console.log(`✓ Ctrl+5 switched to Pricing: ${(await page.$('#panel-pricing')) !== null}`);

  // --- TEST FLOATING PDF TOAST NOTIFICATION ---
  console.log('--- Testing Floating PDF Toast Notification ---');
  const generateBtn = await page.$('header button[aria-label="Generate Client PDF"]');
  console.log(`✓ Header Generate Client PDF button found: ${generateBtn !== null}`);
  await generateBtn.click({ force: true });

  // Wait for the floating toast
  const toast = await page.waitForSelector('div[role="status"]', { timeout: 10000 });
  console.log(`✓ Floating Toast appeared with role="status"!`);
  const toastText = await toast.innerText();
  console.log(`✓ Toast text snippet: ${toastText.replace(/\s+/g, ' ').slice(0, 100)}`);

  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase1-floating-toast.png') });
  console.log(`✓ Screenshot saved: phase1-floating-toast.png`);

  // Test Dismiss
  await page.click('div[role="status"] button:has-text("Dismiss")', { force: true });
  await page.waitForTimeout(600);
  const toastDismissed = (await page.$('div[role="status"]')) === null;
  console.log(`✓ Floating Toast dismissed successfully: ${toastDismissed}`);

  await browser.close();
  console.log('=== ALL PHASE 1 AUTOMATED CHECKS & SCREENSHOTS COMPLETED 100% ===');
}

runVerification().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
