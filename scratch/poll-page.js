const { chromium } = require('playwright');
const path = require('path');

async function check() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  page.on('console', msg => console.log('BROWSER LOG:', msg.type(), msg.text()));
  page.on('pageerror', err => console.error('BROWSER ERROR:', err));

  console.log('Navigating to editor...');
  await page.goto('http://localhost:3000/itineraries/feb43b07-4013-47eb-a80c-40fb494eba70/edit', {
    waitUntil: 'domcontentloaded',
  });

  console.log('DOM Content Loaded. Waiting for state...');
  for (let i = 1; i <= 6; i++) {
    await page.waitForTimeout(2000);
    const bodyText = await page.innerText('body');
    const hasNav = (await page.$('nav[aria-label="Itinerary Workflow Stepper"]')) !== null;
    const hasBasics = (await page.$('#panel-overview')) !== null;
    console.log(`[T+${i * 2}s] hasNav: ${hasNav}, hasBasics: ${hasBasics}, body snippet: ${bodyText.replace(/\s+/g, ' ').slice(0, 80)}`);
    if (hasNav) {
      console.log('SUCCESS! Nav detected!');
      break;
    }
  }

  await browser.close();
}

check().catch(console.error);
