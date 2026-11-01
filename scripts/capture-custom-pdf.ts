import { chromium } from "playwright";
import { getItinerary, saveItineraryData } from "../src/lib/db/itineraries";

async function captureCustomPdfCrop() {
  const itineraryId = "feb43b07-4013-47eb-a80c-40fb494eba70";
  const existing = await getItinerary(itineraryId);
  if (!existing) return;

  existing.pricing = {
    ...existing.pricing,
    pricingType: "custom",
    customBreakup: {
      flight: { included: true, amountPaise: 3000000, note: "Indigo Return DEL-GOA with 15kg baggage" },
      hotel: { included: true, amountPaise: 4000000, note: "5-Star Taj Fort Aguada Luxury Resort" },
      landPart: { included: true, amountPaise: 2000000, note: "Private AC Cab Airport Transfers & Sightseeing" },
      visa: { included: false, amountPaise: 0, note: "" }, // EXCLUDED
    },
  };
  await saveItineraryData(itineraryId, existing);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1200, height: 1600 } });

  await page.goto(`http://localhost:3000/print/${itineraryId}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  const priceTable = await page.$("text=Package Price Breakup");
  if (priceTable) {
    const section = await page.evaluateHandle((el) => el?.closest("section"), priceTable);
    if (section && section.asElement()) {
      await section.asElement()!.screenshot({
        path: "C:/Users/Admin/.gemini/antigravity/brain/9627fe67-27b9-421a-a4db-5bb956f502d1/pdf-price-table-custom-crop.png"
      });
      console.log("Captured Custom PDF price table crop!");
    }
  }

  await browser.close();
}

captureCustomPdfCrop().catch(console.error);
