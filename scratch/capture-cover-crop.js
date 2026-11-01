const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/Admin/.gemini/antigravity/brain/9627fe67-27b9-421a-a4db-5bb956f502d1';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 1600 }, deviceScaleFactor: 2 });
  await page.goto('http://localhost:3000/print/feb43b07-4013-47eb-a80c-40fb494eba70?preview=1', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  
  // Crop to hero typography area
  const heroHeading = await page.locator('header.cover-page h1').first();
  if (heroHeading) {
    await heroHeading.screenshot({ path: path.join(ARTIFACT_DIR, 'heading-closeup.png') });
    console.log('Captured heading-closeup.png');
  }

  // Also capture the logo in header
  const logo = await page.locator('header.cover-page img[alt*="TrippyGo"]').first();
  if (logo) {
    await logo.screenshot({ path: path.join(ARTIFACT_DIR, 'logo-closeup.png') });
    console.log('Captured logo-closeup.png');
  }

  // Also capture full hero section
  const heroSection = await page.locator('header.cover-page > div.relative.z-10.my-auto').first();
  if (heroSection) {
    await heroSection.screenshot({ path: path.join(ARTIFACT_DIR, 'hero-section-closeup.png') });
    console.log('Captured hero-section-closeup.png');
  }

  await browser.close();
})();
