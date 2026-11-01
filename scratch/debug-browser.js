const { chromium } = require('playwright');
const path = require('path');

async function debug() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  page.on('console', (msg) => console.log('PAGE CONSOLE:', msg.text()));
  page.on('pageerror', (err) => console.error('PAGE ERROR:', err));

  console.log('Navigating...');
  await page.goto('http://127.0.0.1:3000/itineraries/feb43b07-4013-47eb-a80c-40fb494eba70/edit');
  console.log('Page loaded, waiting 4s...');
  await page.waitForTimeout(4000);
  console.log('Current URL:', page.url());
  await page.screenshot({ path: path.join(__dirname, 'debug-screen.png') });
  const html = await page.content();
  console.log('HTML snippet:', html.slice(0, 500));
  await browser.close();
}

debug().catch(console.error);
