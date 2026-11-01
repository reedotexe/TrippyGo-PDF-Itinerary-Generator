const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/Admin/.gemini/antigravity/brain/9627fe67-27b9-421a-a4db-5bb956f502d1';
const ITINERARY_ID = 'feb43b07-4013-47eb-a80c-40fb494eba70';
const URL = `http://localhost:3000/itineraries/${ITINERARY_ID}/edit`;

async function testPdfToast() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  page.on('console', msg => console.log('LOG [' + msg.type() + ']:', msg.text()));
  page.on('dialog', async dialog => {
    console.log('DIALOG DETECTED:', dialog.message());
    await dialog.accept();
  });

  console.log('Navigating...');
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('nav[aria-label="Itinerary Workflow Stepper"]', { timeout: 15000 });
  await page.waitForTimeout(1000);

  console.log('Clicking Generate Client PDF...');
  const btn = await page.$('header button[aria-label="Generate Client PDF"]');
  await btn.click();

  console.log('Waiting for role="status"...');
  const toast = await page.waitForSelector('div[role="status"]', { timeout: 60000 });
  console.log('Toast found! Text:', await toast.innerText());

  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase1-floating-toast.png') });
  console.log('Screenshot saved to phase1-floating-toast.png');

  await browser.close();
}

testPdfToast().catch(console.error);
