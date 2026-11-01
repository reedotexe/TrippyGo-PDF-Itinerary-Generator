import { chromium } from "playwright";
import * as path from "path";

async function captureDetailedCrops() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1200, height: 1600 } });

  const itineraryId = "feb43b07-4013-47eb-a80c-40fb494eba70";

  // 1. PDF price table crop
  await page.goto(`http://localhost:3000/print/${itineraryId}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  // Find the price table container
  const priceTable = await page.$("text=Package Price Breakup");
  if (priceTable) {
    // get parent section
    const section = await page.evaluateHandle((el) => el?.closest("section"), priceTable);
    if (section && section.asElement()) {
      await section.asElement()!.screenshot({
        path: "C:/Users/Admin/.gemini/antigravity/brain/9627fe67-27b9-421a-a4db-5bb956f502d1/pdf-price-table-crop.png"
      });
      console.log("Captured PDF price table crop!");
    }
  }

  // 2. Editor pricing panel crop
  await page.goto(`http://localhost:3000/itineraries/${itineraryId}/edit`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  const editorPricing = await page.$("text=Package Pricing & Commercials");
  if (editorPricing) {
    const card = await page.evaluateHandle((el) => el?.closest(".bg-white.rounded-xl.p-5"), editorPricing);
    if (card && card.asElement()) {
      await card.asElement()!.screenshot({
        path: "C:/Users/Admin/.gemini/antigravity/brain/9627fe67-27b9-421a-a4db-5bb956f502d1/editor-pricing-crop.png"
      });
      console.log("Captured Editor pricing card crop!");
    }
  }

  await browser.close();
}

captureDetailedCrops().catch(console.error);
