const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/Admin/.gemini/antigravity/brain/9627fe67-27b9-421a-a4db-5bb956f502d1';

(async () => {
  const browser = await chromium.launch();

  // Desktop / Print View
  const desktopPage = await browser.newPage({ viewport: { width: 1200, height: 1600 }, deviceScaleFactor: 2 });
  await desktopPage.goto('http://localhost:3000/print/feb43b07-4013-47eb-a80c-40fb494eba70?preview=1', { waitUntil: 'networkidle' });
  await desktopPage.waitForTimeout(1000);

  const backFooter = await desktopPage.locator('.back-page-footer').first();
  if (backFooter) {
    await backFooter.screenshot({ path: path.join(ARTIFACT_DIR, 'new-back-footer-desktop.png') });
    console.log('Captured new-back-footer-desktop.png');
  }

  const backPage = await desktopPage.locator('footer.back-page').first();
  if (backPage) {
    await backPage.screenshot({ path: path.join(ARTIFACT_DIR, 'new-back-page-full.png') });
    console.log('Captured new-back-page-full.png');
  }

  // Mobile View
  const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true });
  await mobilePage.goto('http://localhost:3000/print/feb43b07-4013-47eb-a80c-40fb494eba70?preview=1', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(1000);

  const mobileBackFooter = await mobilePage.locator('.back-page-footer').first();
  if (mobileBackFooter) {
    await mobileBackFooter.screenshot({ path: path.join(ARTIFACT_DIR, 'new-back-footer-mobile.png') });
    console.log('Captured new-back-footer-mobile.png');
  }

  await browser.close();
  console.log('Verification screenshots complete.');
})();
