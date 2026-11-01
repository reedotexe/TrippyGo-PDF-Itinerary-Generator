import { chromium } from "playwright";
import { getItinerary, saveItineraryData } from "../src/lib/db/itineraries";

async function verifyUserScenario() {
  const itineraryId = "feb43b07-4013-47eb-a80c-40fb494eba70";
  const existing = await getItinerary(itineraryId);
  if (!existing) return;

  existing.pricing = {
    ...existing.pricing,
    pricingType: "custom",
    basis: "total_group",
    validityDays: 7,
    customBreakup: {
      flight: { included: true, amountPaise: 8900000, note: "Return airfare, scheduled flights & taxes" },
      landPart: { included: true, amountPaise: 3200000, note: "Private transfers, sightseeing, excursions & guide" },
      hotel: { included: false, amountPaise: 0, note: "" },
      visa: { included: false, amountPaise: 0, note: "" },
    },
  };
  await saveItineraryData(itineraryId, existing);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1200, height: 1600 } });

  // 1. PDF Price Table Crop
  await page.goto(`http://localhost:3000/print/${itineraryId}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  const priceTable = await page.$("text=Package Price Breakup");
  if (priceTable) {
    const section = await page.evaluateHandle((el) => el?.closest("section"), priceTable);
    if (section && section.asElement()) {
      await section.asElement()!.screenshot({
        path: "C:/Users/Admin/.gemini/antigravity/brain/9627fe67-27b9-421a-a4db-5bb956f502d1/user-exact-scenario-no-gst.png"
      });
      console.log("Captured user exact scenario without GST!");
    }
  }

  // 2. Editor Terms & Validity Card Crop
  await page.goto(`http://localhost:3000/itineraries/${itineraryId}/edit`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  const editorTerms = await page.$("text=Proposal Terms & Validity");
  if (editorTerms) {
    const container = await page.evaluateHandle((el) => el?.closest(".border-t.border-slate-100"), editorTerms);
    if (container && container.asElement()) {
      await container.asElement()!.screenshot({
        path: "C:/Users/Admin/.gemini/antigravity/brain/9627fe67-27b9-421a-a4db-5bb956f502d1/editor-terms-no-gst.png"
      });
      console.log("Captured Editor terms card without GST!");
    }
  }

  await browser.close();
}

verifyUserScenario().catch(console.error);
