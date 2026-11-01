const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/Admin/.gemini/antigravity/brain/9627fe67-27b9-421a-a4db-5bb956f502d1';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 1600 }, deviceScaleFactor: 2 });
  
  console.log('Navigating to itinerary print preview...');
  await page.goto('http://localhost:3000/print/feb43b07-4013-47eb-a80c-40fb494eba70?preview=1', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Check Cover Page has NO footer
  const coverPage = page.locator('header.cover-page');
  const coverCount = await coverPage.count();
  console.log('Cover page exists:', coverCount > 0);
  if (coverCount > 0) {
    const coverFooters = await coverPage.locator('.page-footer-element').count();
    console.log('Cover page footer count (should be 0):', coverFooters);
    await coverPage.screenshot({ path: path.join(ARTIFACT_DIR, 'verify-cover-no-footer.png') });
  }

  // Find all page footers
  const footers = page.locator('.page-footer-element');
  const footerCount = await footers.count();
  console.log('Total page footers found across document:', footerCount);

  // Screenshot Page 2 (Trip Summary)
  const page2 = page.locator('section.itinerary-page').first();
  if (await page2.count() > 0) {
    await page2.screenshot({ path: path.join(ARTIFACT_DIR, 'verify-page-2-overview.png') });
    const p2Footer = page2.locator('.page-footer-element');
    if (await p2Footer.count() > 0) {
      await p2Footer.screenshot({ path: path.join(ARTIFACT_DIR, 'verify-page-2-footer-closeup.png') });
      console.log('Captured Page 2 full & footer closeup');
    }
  }

  // Screenshot a Day page
  const allSections = page.locator('section.itinerary-page');
  const sectionCount = await allSections.count();
  console.log('Total itinerary pages:', sectionCount);

  if (sectionCount >= 3) {
    const dayPage = allSections.nth(1);
    await dayPage.screenshot({ path: path.join(ARTIFACT_DIR, 'verify-page-3-day.png') });
    const dayFooter = dayPage.locator('.page-footer-element');
    if (await dayFooter.count() > 0) {
      await dayFooter.screenshot({ path: path.join(ARTIFACT_DIR, 'verify-page-3-footer-closeup.png') });
      console.log('Captured Day page full & footer closeup');
    }
  }

  // Screenshot Back Page
  const backPage = page.locator('.back-page');
  if (await backPage.count() > 0) {
    await backPage.screenshot({ path: path.join(ARTIFACT_DIR, 'verify-back-page-full.png') });
    const backFooter = backPage.locator('.page-footer-element');
    if (await backFooter.count() > 0) {
      await backFooter.screenshot({ path: path.join(ARTIFACT_DIR, 'verify-back-page-footer-closeup.png') });
      console.log('Captured Back page full & footer closeup');
    }
  }

  // Print Media Emulation Test
  console.log('Testing print media emulation...');
  await page.emulateMedia({ media: 'print' });
  await page.waitForTimeout(1000);

  // Check Page 2 under print media
  if (await page2.count() > 0) {
    await page2.screenshot({ path: path.join(ARTIFACT_DIR, 'verify-print-page-2.png') });
    console.log('Captured Page 2 under print media');
  }

  // Check Back page under print media
  if (await backPage.count() > 0) {
    await backPage.screenshot({ path: path.join(ARTIFACT_DIR, 'verify-print-back-page.png') });
    console.log('Captured Back page under print media');
  }

  await browser.close();
  console.log('All footer verifications completed successfully!');
})();
