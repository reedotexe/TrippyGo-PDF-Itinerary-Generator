import { chromium } from "playwright";

async function captureCustomEditorCrop() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1200, height: 1600 } });

  const itineraryId = "feb43b07-4013-47eb-a80c-40fb494eba70";
  await page.goto(`http://localhost:3000/itineraries/${itineraryId}/edit`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  // Click on "2. Custom Made Itinerary"
  const customTab = await page.$("text=2. Custom Made Itinerary");
  if (customTab) {
    await customTab.click();
    await page.waitForTimeout(500);
  }

  const editorPricing = await page.$("text=Package Pricing & Commercials");
  if (editorPricing) {
    const card = await page.evaluateHandle((el) => el?.closest(".bg-white.rounded-xl.p-5"), editorPricing);
    if (card && card.asElement()) {
      await card.asElement()!.screenshot({
        path: "C:/Users/Admin/.gemini/antigravity/brain/9627fe67-27b9-421a-a4db-5bb956f502d1/editor-pricing-custom-crop.png"
      });
      console.log("Captured Custom Editor pricing card crop!");
    }
  }

  await browser.close();
}

captureCustomEditorCrop().catch(console.error);
