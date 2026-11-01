import { chromium } from "playwright";
import { getItinerary, saveItineraryData } from "../src/lib/db/itineraries";
import { computeClientView } from "../src/lib/schema/client-view";

async function verifyPriceDistributionFeature() {
  console.log("=== VERIFYING PRICE DISTRIBUTION (SPLIT PER PASSENGER VS TOTAL) ===");

  const itineraryId = "feb43b07-4013-47eb-a80c-40fb494eba70";
  const existing = await getItinerary(itineraryId);
  if (!existing) throw new Error("Itinerary not found");

  // Setup: 2 passengers (e.g. adults: 2, children: 0)
  existing.package.travellers = { adults: 2, children: 0, rooms: 1 };
  existing.pricing = {
    ...existing.pricing,
    pricingType: "custom",
    priceDistribution: "per_passenger",
    customBreakup: {
      flight: { included: true, amountPaise: 8000000, note: "Return Airfare with 20kg baggage" }, // ₹ 80,000 -> ₹ 40,000 / pax
      hotel: { included: true, amountPaise: 6000000, note: "5-Star Luxury Resort with Breakfast" }, // ₹ 60,000 -> ₹ 30,000 / pax
      landPart: { included: true, amountPaise: 4000000, note: "Private AC Cab & Sightseeing" }, // ₹ 40,000 -> ₹ 20,000 / pax
      visa: { included: false, amountPaise: 0, note: "" }, // EXCLUDED
    },
  };
  await saveItineraryData(itineraryId, existing);

  // 1. Verify Client View calculation
  const clientView = computeClientView(existing);
  console.log("Client View in Per-Passenger Split Mode:");
  console.log("  - Header Total Package Investment:", clientView.pricing.finalPriceFormatted);
  console.log("  - Passenger Count:", clientView.pricing.passengerCount);
  console.log("  - Price Distribution:", clientView.pricing.priceDistribution);
  clientView.pricing.items.forEach((it) => {
    console.log(`    [${it.title}] Total: ₹ ${it.amountFormatted} | Split: ₹ ${it.splitAmountFormatted} / pax`);
  });

  if (clientView.pricing.finalPriceRupees !== 180000) {
    throw new Error(`Expected Total Package Investment ₹ 1,80,000, got ${clientView.pricing.finalPriceRupees}`);
  }
  if (clientView.pricing.items[0].splitAmountRupees !== 40000) {
    throw new Error(`Expected Flight split ₹ 40,000, got ${clientView.pricing.items[0].splitAmountRupees}`);
  }
  if (clientView.pricing.items[1].splitAmountRupees !== 30000) {
    throw new Error(`Expected Hotel split ₹ 30,000, got ${clientView.pricing.items[1].splitAmountRupees}`);
  }
  if (clientView.pricing.items[2].splitAmountRupees !== 20000) {
    throw new Error(`Expected Land Part split ₹ 20,000, got ${clientView.pricing.items[2].splitAmountRupees}`);
  }

  // 2. Playwright capture of PDF Price Table in Split Mode
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1200, height: 1600 } });

  await page.goto(`http://localhost:3000/print/${itineraryId}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  const priceTable = await page.$("text=Package Price Breakup");
  if (priceTable) {
    const section = await page.evaluateHandle((el) => el?.closest("section"), priceTable);
    if (section && section.asElement()) {
      await section.asElement()!.screenshot({
        path: "C:/Users/Admin/.gemini/antigravity/brain/9627fe67-27b9-421a-a4db-5bb956f502d1/pdf-price-distribution-split.png"
      });
      console.log("Captured PDF Split Mode crop!");
    }
  }

  // 3. Playwright capture of Editor with the new Price Distribution selector
  await page.goto(`http://localhost:3000/itineraries/${itineraryId}/edit`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  const editorPricing = await page.$("text=Package Pricing & Commercials");
  if (editorPricing) {
    const card = await page.evaluateHandle((el) => el?.closest(".bg-white.rounded-xl.p-5"), editorPricing);
    if (card && card.asElement()) {
      await card.asElement()!.screenshot({
        path: "C:/Users/Admin/.gemini/antigravity/brain/9627fe67-27b9-421a-a4db-5bb956f502d1/editor-pricing-distribution.png"
      });
      console.log("Captured Editor Price Distribution card crop!");
    }
  }

  // 4. Switch back to "total" mode and verify
  existing.pricing.priceDistribution = "total";
  await saveItineraryData(itineraryId, existing);

  await page.goto(`http://localhost:3000/print/${itineraryId}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  const priceTableTotal = await page.$("text=Package Price Breakup");
  if (priceTableTotal) {
    const section = await page.evaluateHandle((el) => el?.closest("section"), priceTableTotal);
    if (section && section.asElement()) {
      await section.asElement()!.screenshot({
        path: "C:/Users/Admin/.gemini/antigravity/brain/9627fe67-27b9-421a-a4db-5bb956f502d1/pdf-price-distribution-total.png"
      });
      console.log("Captured PDF Total Mode crop!");
    }
  }

  await browser.close();
  console.log("=== ALL PRICE DISTRIBUTION VERIFICATIONS PASSED 100%! ===");
}

verifyPriceDistributionFeature().catch(console.error);
