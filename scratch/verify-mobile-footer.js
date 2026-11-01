const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/Admin/.gemini/antigravity/brain/9627fe67-27b9-421a-a4db-5bb956f502d1';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true });
  
  await page.goto('http://localhost:3000/print/feb43b07-4013-47eb-a80c-40fb494eba70?preview=1', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  const footer = page.locator('.page-footer-element').first();
  if (await footer.count() > 0) {
    await footer.screenshot({ path: path.join(ARTIFACT_DIR, 'verify-mobile-footer-closeup.png') });
    console.log('Captured mobile footer closeup');
  }

  await browser.close();
})();
