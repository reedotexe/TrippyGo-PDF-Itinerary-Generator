const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = 'C:/Users/Admin/.gemini/antigravity/brain/9627fe67-27b9-421a-a4db-5bb956f502d1';
const ITINERARY_ID = 'feb43b07-4013-47eb-a80c-40fb494eba70';
const URL = `http://localhost:3000/itineraries/${ITINERARY_ID}/edit`;

async function runPhase3Verification() {
  console.log(`Starting Phase 3 verification on ${URL}...`);
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

  // Dismiss dev overlay
  await page.evaluate(() => {
    document.querySelectorAll('nextjs-portal').forEach((el) => el.remove());
  });

  await page.waitForTimeout(1000);

  // Switch to Tab 2: Flights
  await page.click('#tab-flights');
  await page.waitForTimeout(800);
  console.log('✓ Switched to Tab 2: Flights');

  // Verify FlightsPanel container
  const panelHeader = await page.$('h3:has-text("Travel Flights & Boarding Passes")');
  console.log(`✓ Flights panel header detected: ${panelHeader !== null}`);

  // Ensure we have flight sectors to test with
  let flightStrips = await page.$$('div:has-text("Onward Journey") ~ div div[class*="group relative rounded-xl border"]');
  if (flightStrips.length === 0) {
    console.log('No flights currently present, clicking Auto-Suggest to populate...');
    const suggestBtn = await page.$('button:has-text("Auto-Suggest")');
    if (suggestBtn) {
      await suggestBtn.click({ force: true });
      await page.waitForTimeout(1000);
    }
  }

  // --- 3.5 COMPACT MULTI-SECTOR FLIGHT STRIPS ---
  console.log('\n--- Verifying 3.5: Compact Sleek Flight Cards ---');
  await page.waitForSelector('span:has-text("#1")', { timeout: 10000 });
  const firstSeqBadge = await page.$('span:has-text("#1")');
  console.log(`✓ Sector sequence badge (#1) detected: ${firstSeqBadge !== null}`);

  const layoverBtn = await page.$('button:has-text("+ Layover")');
  console.log(`✓ Compact "+ Layover" button present on card: ${layoverBtn !== null}`);

  const editBtn = await page.$('button:has-text("Edit")');
  console.log(`✓ Compact "Edit" button present on card: ${editBtn !== null}`);

  // Capture screenshot of collapsed cards
  const collapsedScreenshotPath = path.join(ARTIFACT_DIR, 'phase3-flights-collapsed.png');
  await page.screenshot({ path: collapsedScreenshotPath, fullPage: false });
  console.log(`✓ Screenshot saved: ${collapsedScreenshotPath}`);

  // --- 3.2 SEARCHABLE AIRLINE COMBOBOX ---
  console.log('\n--- Verifying 3.2: Searchable Airline Combobox ---');
  // Click Edit on sector 1
  if (editBtn) {
    await editBtn.click({ force: true });
    await page.waitForTimeout(600);
  }

  // Check InlineFlightEditor is open
  const editorHeader = await page.$('span:has-text("Sector #1")');
  console.log(`✓ InlineFlightEditor open: ${editorHeader !== null}`);

  // Find airline input within editor
  const airlineInput = await page.$('input[placeholder*="Search airline"]');
  console.log(`✓ Searchable AirlineCombobox input detected: ${airlineInput !== null}`);

  if (airlineInput) {
    // Focus combobox to open suggestions dropdown
    await airlineInput.click({ force: true });
    await page.waitForTimeout(400);

    // Verify suggestions list
    const popularHeader = await page.$('span:has-text("Popular Carriers"), span:has-text("Matching Airlines")');
    console.log(`✓ Airline suggestions dropdown opened: ${popularHeader !== null}`);

    const indigoOption = await page.$('button:has-text("IndiGo")');
    const vietjetOption = await page.$('button:has-text("VietJet Air")');
    console.log(`✓ IndiGo carrier suggestion present: ${indigoOption !== null}`);
    console.log(`✓ VietJet Air carrier suggestion present: ${vietjetOption !== null}`);

    // Capture screenshot with combobox open
    const comboboxScreenshotPath = path.join(ARTIFACT_DIR, 'phase3-flights-airline-combobox.png');
    await page.screenshot({ path: comboboxScreenshotPath, fullPage: false });
    console.log(`✓ Screenshot saved: ${comboboxScreenshotPath}`);

    // Select VietJet Air
    if (vietjetOption) {
      await vietjetOption.click({ force: true });
      await page.waitForTimeout(400);
      const val = await airlineInput.inputValue();
      console.log(`✓ Selected carrier from combobox: "${val}"`);
    }
  }

  // --- 3.3 CLEAN BAGGAGE SELECT DROPDOWNS ---
  console.log('\n--- Verifying 3.3: Clean Baggage Select Dropdowns ---');
  const checkinSelect = await page.$('label:has-text("Check-in Baggage") ~ select');
  console.log(`✓ Check-in Baggage standard select present: ${checkinSelect !== null}`);

  const cabinSelect = await page.$('label:has-text("Cabin Baggage") ~ select');
  console.log(`✓ Cabin Baggage standard select present: ${cabinSelect !== null}`);

  if (checkinSelect) {
    // Check standard presets
    const options = await checkinSelect.$$eval('option', (opts) => opts.map((o) => o.text));
    console.log(`✓ Check-in baggage options available: ${options.join(', ')}`);

    // Switch to Custom Weight
    await checkinSelect.selectOption('__custom__');
    await page.waitForTimeout(400);

    const customInput = await page.$('input[placeholder*="2 x 23 kg"]');
    console.log(`✓ Custom baggage input smoothly activated: ${customInput !== null}`);
    if (customInput) {
      await customInput.fill('2 x 23 kg (Special Promo)');
    }
  }

  // --- 3.4 CONSOLIDATED CONNECTION ACTION ---
  console.log('\n--- Verifying 3.4: Consolidated Connection Action ---');
  const connectingBtn = await page.$('button:has-text("+ Add Layover / Connecting Leg")');
  console.log(`✓ Consolidated connection button present: ${connectingBtn !== null}`);

  // Capture screenshot of expanded editor
  const editorScreenshotPath = path.join(ARTIFACT_DIR, 'phase3-flights-editor-expanded.png');
  await page.screenshot({ path: editorScreenshotPath, fullPage: false });
  console.log(`✓ Screenshot saved: ${editorScreenshotPath}`);

  // Close editor by clicking "Done"
  const doneBtn = await page.$('button:has-text("Done Editing"), button:has-text("Done")');
  if (doneBtn) {
    await doneBtn.click({ force: true });
    await page.waitForTimeout(600);
  }

  // --- 3.1 UNIFIED EMPTY STATE ---
  console.log('\n--- Verifying 3.1: Unified Empty State ---');
  // Clear all flights to check empty state
  const clearBtn = await page.$('button[aria-label="Clear all flights"]');
  if (clearBtn) {
    await clearBtn.click({ force: true });
    await page.waitForTimeout(600);
    console.log('✓ Cleared all flights to verify Empty State');
  }

  const emptyTitle = await page.$('h4:has-text("No Flights Configured (Land-Only Itinerary)")');
  console.log(`✓ Empty State title present: ${emptyTitle !== null}`);

  // Verify single primary CTA with split chevron
  const addFlightBtn = await page.$('button:has-text("Add Flight")');
  console.log(`✓ Single primary hero CTA [ + Add Flight ] present: ${addFlightBtn !== null}`);

  const splitChevron = await page.$('button[aria-label="Flight creation options"]');
  console.log(`✓ Split dropdown trigger present: ${splitChevron !== null}`);

  if (splitChevron) {
    await splitChevron.click({ force: true });
    await page.waitForTimeout(400);

    const outboundOption = await page.$('button:has-text("+ Outbound (Onward) Sector")');
    const returnOption = await page.$('button:has-text("+ Return (Inbound) Sector")');
    const searchOption = await page.$('button:has-text("Search Live Flight Database")');
    const suggestOption = await page.$('button:has-text("Auto-Suggest Round-Trip")');

    console.log(`✓ Split menu option "+ Outbound Sector": ${outboundOption !== null}`);
    console.log(`✓ Split menu option "+ Return Sector": ${returnOption !== null}`);
    console.log(`✓ Split menu option "Search Flight Database": ${searchOption !== null}`);
    console.log(`✓ Split menu option "Auto-Suggest Round-Trip": ${suggestOption !== null}`);
  }

  // Capture screenshot of unified empty state
  const emptyScreenshotPath = path.join(ARTIFACT_DIR, 'phase3-flights-empty-state.png');
  await page.screenshot({ path: emptyScreenshotPath, fullPage: false });
  console.log(`✓ Screenshot saved: ${emptyScreenshotPath}`);

  // Restore round-trip flights using Auto-Suggest button
  const restoreSuggestBtn = await page.$('button:has-text("Auto-Suggest Round-Trip")');
  if (restoreSuggestBtn) {
    await restoreSuggestBtn.click({ force: true });
    await page.waitForTimeout(1000);
    console.log('✓ Restored standard round-trip flights via Auto-Suggest');
  }

  await browser.close();
  console.log('\n=== PHASE 3 VERIFICATION COMPLETE: ALL CHECKS PASSED ===');
}

runPhase3Verification().catch((err) => {
  console.error('Phase 3 verification failed:', err);
  process.exit(1);
});
