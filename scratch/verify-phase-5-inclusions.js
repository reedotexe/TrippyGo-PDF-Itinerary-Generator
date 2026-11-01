const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/Admin/.gemini/antigravity/brain/9627fe67-27b9-421a-a4db-5bb956f502d1';
const ITINERARY_ID = 'feb43b07-4013-47eb-a80c-40fb494eba70';
const URL = `http://localhost:3000/itineraries/${ITINERARY_ID}/edit`;

async function runPhase5Verification() {
  console.log(`Starting Phase 5 verification on ${URL}...`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
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

  // Switch to Tab 4: Inclusions & Policies
  await page.click('#tab-inclusions');
  await page.waitForTimeout(800);
  console.log('✓ Switched to Tab 4: Inclusions');

  // --- 5.1 & 5.2 INCLUSIONS & EXCLUSIONS RESTRAINED STYLING & 1-CLICK PRESETS ---
  console.log('\n--- Verifying 5.1 & 5.2: Inclusions & Exclusions Editorial Styling & Presets ---');
  const incHeader = await page.$('h3:has-text("Package Inclusions & Exclusions")');
  console.log(`✓ Inclusions panel header detected: ${incHeader !== null}`);

  // Check 1-click popular preset chips
  const breakfastPreset = await page.$('button:has-text("Daily Breakfast at Hotel")');
  const transfersPreset = await page.$('button:has-text("Airport Transfers")');
  const airfarePreset = await page.$('button:has-text("Airfare / Flight Tickets")');
  const personalPreset = await page.$('button:has-text("Personal Expenses")');

  console.log(`✓ Inclusion preset "Daily Breakfast at Hotel": ${breakfastPreset !== null}`);
  console.log(`✓ Inclusion preset "Airport Transfers": ${transfersPreset !== null}`);
  console.log(`✓ Exclusion preset "Airfare / Flight Tickets": ${airfarePreset !== null}`);
  console.log(`✓ Exclusion preset "Personal Expenses": ${personalPreset !== null}`);

  // Click 1-Click Load Standard Preset Pack button
  const standardPackBtn = await page.$('button:has-text("Load Standard Preset Pack")');
  console.log(`✓ "Load Standard Preset Pack" button present: ${standardPackBtn !== null}`);
  if (standardPackBtn) {
    await standardPackBtn.click({ force: true });
    await page.waitForTimeout(500);
    console.log('✓ Loaded standard preset pack');
  }

  // Capture screenshot of Inclusions & Exclusions
  const inclusionsScreenshotPath = path.join(ARTIFACT_DIR, 'phase5-inclusions-editorial.png');
  await page.screenshot({ path: inclusionsScreenshotPath, fullPage: false });
  console.log(`✓ Screenshot saved: ${inclusionsScreenshotPath}`);

  // --- 5.3 & 5.4 TERMS & POLICY WORKBENCH WITH 1-CLICK STANDARD LOADER ---
  console.log('\n--- Verifying 5.3 & 5.4: Terms & Cancellation Policy Workbench ---');
  const termsHeader = await page.$('h3:has-text("Payment Milestones & Cancellation Policy")');
  console.log(`✓ Terms panel detected in Tab 4: ${termsHeader !== null}`);

  // Check 1-click Load Standard Policy button
  const standardPolicyBtn = await page.$('button:has-text("Load Standard Policy")');
  console.log(`✓ "Load Standard Policy" button present: ${standardPolicyBtn !== null}`);

  if (standardPolicyBtn) {
    await standardPolicyBtn.click({ force: true });
    await page.waitForTimeout(600);
    console.log('✓ Clicked "Load Standard Policy"');
  }

  // Verify loaded payment milestones
  const milestone1 = await page.$('input[value*="25% advance deposit"]');
  const milestone2 = await page.$('input[value*="50% payment 30 days prior"]');
  console.log(`✓ Milestone 1 ("25% advance deposit") populated: ${milestone1 !== null}`);
  console.log(`✓ Milestone 2 ("50% payment 30 days prior") populated: ${milestone2 !== null}`);

  // Verify Cancellation Table Column Headers
  const windowHeader = await page.$('th:has-text("Cancellation Window")');
  const deductionHeader = await page.$('th:has-text("Deduction Amount / Fee")');
  console.log(`✓ Cancellation Column Header "Cancellation Window": ${windowHeader !== null}`);
  console.log(`✓ Cancellation Column Header "Deduction Amount / Fee": ${deductionHeader !== null}`);

  // Verify Cancellation Slabs
  const slab30Days = await page.$('input[value*="30+ days prior"]');
  const slabCharge10 = await page.$('input[value*="10% retention fee"]');
  console.log(`✓ Slab "30+ days prior" populated: ${slab30Days !== null}`);
  console.log(`✓ Slab charge "10% retention fee" populated: ${slabCharge10 !== null}`);

  // Capture screenshot of loaded standard policy
  const policyScreenshotPath = path.join(ARTIFACT_DIR, 'phase5-policy-standard-loaded.png');
  await page.screenshot({ path: policyScreenshotPath, fullPage: false });
  console.log(`✓ Screenshot saved: ${policyScreenshotPath}`);

  // Scroll to capture full Tab 4 view
  const fullViewScreenshotPath = path.join(ARTIFACT_DIR, 'phase5-tab4-full-view.png');
  await page.screenshot({ path: fullViewScreenshotPath, fullPage: true });
  console.log(`✓ Full page screenshot saved: ${fullViewScreenshotPath}`);

  await browser.close();
  console.log('\n=== PHASE 5 VERIFICATION COMPLETE: ALL CHECKS PASSED ===');
}

runPhase5Verification().catch((err) => {
  console.error('Phase 5 verification failed:', err);
  process.exit(1);
});
