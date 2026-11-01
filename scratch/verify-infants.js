const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/Admin/.gemini/antigravity/brain/9627fe67-27b9-421a-a4db-5bb956f502d1';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 2 });

  await page.goto('http://localhost:3000/itineraries/feb43b07-4013-47eb-a80c-40fb494eba70/edit', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  // Target the container of #basic-infants
  const travellersContainer = page.locator('#basic-infants').locator('xpath=../../..');
  if (await travellersContainer.count() > 0) {
    await travellersContainer.screenshot({ path: path.join(ARTIFACT_DIR, 'editor-travellers-strip.png') });
    console.log('Captured editor travellers strip');
  }

  await browser.close();
})();
