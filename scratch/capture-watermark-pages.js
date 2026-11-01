const { chromium } = require('playwright');
const path = require('path');

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1200, height: 1600 },
    deviceScaleFactor: 2
  });
  const page = await context.newPage();

  console.log('Navigating to print preview...');
  await page.goto('http://localhost:3000/print/feb43b07-4013-47eb-a80c-40fb494eba70', {
    waitUntil: 'networkidle'
  });

  // Wait for document to render
  await page.waitForSelector('.itinerary-document');

  // Let's capture the whole document or each page section
  const sections = await page.$$('.itinerary-document > header, .itinerary-document > section, .itinerary-document > footer');
  console.log(`Found ${sections.length} document sections/pages.`);

  const artifactDir = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\9627fe67-27b9-421a-a4db-5bb956f502d1';

  for (let i = 0; i < sections.length; i++) {
    const sec = sections[i];
    const tagName = await sec.evaluate(el => el.tagName.toLowerCase());
    const className = await sec.evaluate(el => el.className);
    const hasWatermark = (await sec.$$('.page-watermark')).length > 0;
    console.log(`Page ${i + 1} [${tagName}.${className.slice(0, 20)}...]: hasWatermark = ${hasWatermark}`);

    const shotPath = path.join(artifactDir, `watermark-page-${i + 1}.png`);
    await sec.screenshot({ path: shotPath });
    console.log(`Saved screenshot: watermark-page-${i + 1}.png`);
  }

  await browser.close();
  console.log('Done capturing screenshots.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
