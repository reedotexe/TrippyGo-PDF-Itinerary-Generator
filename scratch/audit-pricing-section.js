const { chromium } = require('playwright');
const path = require('path');

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1200 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  const artifactDir = 'C:/Users/Admin/.gemini/antigravity/brain/9627fe67-27b9-421a-a4db-5bb956f502d1';

  console.log('Navigating to editor page...');
  await page.goto('http://localhost:3000/itineraries/feb43b07-4013-47eb-a80c-40fb494eba70/edit', {
    waitUntil: 'networkidle',
  });

  await page.waitForTimeout(1000);

  const pricingHeading = page.locator('h3:has-text("Package Pricing & Commercials")').first();
  await pricingHeading.scrollIntoViewIfNeeded();

  // The PricingPanel root element
  const pricingCard = pricingHeading.locator('xpath=ancestor::div[contains(@class, "space-y-6")][1]');

  // 1. Supplier Mode with Total Only
  const totalBtn = pricingCard.locator('button:has-text("Total Only (Standard)")').first();
  await totalBtn.click();
  const supplierModeBtn = pricingCard.locator('button:has-text("1. Supplier Itinerary (DMC Quote)")').first();
  await supplierModeBtn.click();
  await page.waitForTimeout(300);
  await pricingCard.screenshot({ path: path.join(artifactDir, 'audit-pricing-supplier-total.png') });
  console.log('Saved audit-pricing-supplier-total.png');

  // 2. Supplier Mode with Split Per Passenger
  const splitBtn = pricingCard.locator('button:has-text("Split Per Passenger")').first();
  await splitBtn.click();
  await page.waitForTimeout(300);
  await pricingCard.screenshot({ path: path.join(artifactDir, 'audit-pricing-supplier-split.png') });
  console.log('Saved audit-pricing-supplier-split.png');

  // 3. Custom Mode with Total Only
  const customModeBtn = pricingCard.locator('button:has-text("2. Custom Made Itinerary")').first();
  await customModeBtn.click();
  await totalBtn.click();
  await page.waitForTimeout(300);
  await pricingCard.screenshot({ path: path.join(artifactDir, 'audit-pricing-custom-total.png') });
  console.log('Saved audit-pricing-custom-total.png');

  // 4. Custom Mode with Split Per Passenger
  await splitBtn.click();
  await page.waitForTimeout(300);
  await pricingCard.screenshot({ path: path.join(artifactDir, 'audit-pricing-custom-split.png') });
  console.log('Saved audit-pricing-custom-split.png');

  // 5. Test inputs & states (Low Margin Warning in Supplier Mode)
  await supplierModeBtn.click();
  // Set supplier cost to 100000 and flat markup to 2000 (2% margin -> low margin warning)
  const supplierCostInput = pricingCard.locator('input#supplier-cost').first();
  await supplierCostInput.fill('100000');
  const markupTypeSelect = pricingCard.locator('select#agency-markup-type').first();
  await markupTypeSelect.selectOption('percent');
  const markupValInput = pricingCard.locator('input#agency-markup-val').first();
  await markupValInput.fill('4'); // 4% triggers < 8% low margin warning
  await page.waitForTimeout(300);
  await pricingCard.screenshot({ path: path.join(artifactDir, 'audit-pricing-supplier-low-margin.png') });
  console.log('Saved audit-pricing-supplier-low-margin.png');

  await browser.close();
  console.log('Finished capturing all detailed states.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
