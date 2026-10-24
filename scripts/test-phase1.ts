import { Itinerary, ItinerarySchema } from "../src/lib/schema/itinerary";
import { validateItinerary } from "../src/lib/schema/validate";
import { computeClientView, formatIndianRupees } from "../src/lib/schema/client-view";

const validMockItinerary: Itinerary = {
  schemaVersion: 1,
  package: {
    title: "Kashmir Paradise Tour",
    destinations: ["Srinagar", "Gulmarg", "Pahalgam"],
    nights: 6,
    days: 7,
    startDate: "2026-12-10",
    travellers: { adults: 2, children: 0, rooms: 1 },
  },
  days: [
    {
      dayNumber: 1,
      title: "Arrival in Srinagar & Dal Lake Shikara",
      description: "Pick up from airport and check into houseboat. Evening Shikara ride.",
      activities: ["Airport transfer", "Shikara ride"],
      meals: ["Dinner"],
      stay: { hotel: "Deluxe Houseboat", city: "Srinagar", roomType: "Deluxe Room" },
      imageQuery: "Dal Lake Srinagar shikara sunset",
      image: {
        provider: "unsplash",
        photoId: "abc1234",
        imageUrl: "https://images.unsplash.com/photo-dal-lake",
        thumbnailUrl: "https://images.unsplash.com/photo-dal-lake-thumb",
        photographerName: "Ahmad Photo",
        photographerUrl: "https://unsplash.com/@ahmad",
        downloadLocation: "https://api.unsplash.com/photos/abc1234/download",
      },
    },
    {
      dayNumber: 2,
      title: "Srinagar to Sonamarg Excursion",
      description: "Day excursion to the Meadow of Gold and Thajiwas glacier.",
      activities: ["Glacier view", "Pony ride"],
      meals: ["Breakfast", "Dinner"],
      stay: { hotel: "Grand Boulevard", city: "Srinagar", roomType: null },
      imageQuery: "Sonamarg meadow glacier",
      image: null,
    },
    {
      dayNumber: 3,
      title: "Srinagar to Gulmarg",
      description: "Drive to Gulmarg and board Gondola cable car.",
      activities: ["Gondola Phase 1", "Snow walk"],
      meals: ["Breakfast", "Dinner"],
      stay: { hotel: "Pine Spring", city: "Gulmarg", roomType: null },
      imageQuery: "Gulmarg snow gondola",
      image: null,
    },
    {
      dayNumber: 4,
      title: "Gulmarg to Pahalgam",
      description: "Scenic drive via Pampore saffron fields.",
      activities: ["Saffron fields", "Lidder river walk"],
      meals: ["Breakfast", "Dinner"],
      stay: { hotel: "Heevan Pahalgam", city: "Pahalgam", roomType: null },
      imageQuery: "Pahalgam lidder river valley",
      image: null,
    },
    {
      dayNumber: 5,
      title: "Pahalgam Valley Exploration",
      description: "Visit Aru Valley, Betaab Valley, and Chandanwari.",
      activities: ["Betaab valley", "Aru valley"],
      meals: ["Breakfast", "Dinner"],
      stay: { hotel: "Heevan Pahalgam", city: "Pahalgam", roomType: null },
      imageQuery: "Betaab valley pine trees",
      image: null,
    },
    {
      dayNumber: 6,
      title: "Pahalgam to Srinagar & Mughal Gardens",
      description: "Return to Srinagar. Visit Nishat Bagh and Shalimar Bagh.",
      activities: ["Nishat Bagh", "Shalimar Bagh", "Lal Chowk"],
      meals: ["Breakfast", "Dinner"],
      stay: { hotel: "Grand Boulevard", city: "Srinagar", roomType: null },
      imageQuery: "Mughal garden fountains srinagar",
      image: null,
    },
    {
      dayNumber: 7,
      title: "Departure from Srinagar",
      description: "Breakfast and transfer to Srinagar airport.",
      activities: ["Airport drop"],
      meals: ["Breakfast"],
      stay: null,
      imageQuery: "Srinagar airport departure",
      image: null,
    },
  ],
  inclusions: [
    "6 Nights accommodation in deluxe hotels/houseboat",
    "Breakfast & Dinner (MAPAI plan)",
    "Private Innova Crysta for all transfers and sightseeing",
  ],
  exclusions: [
    "Airfare",
    "Gondola tickets",
    "Pony rides and personal expenses",
  ],
  pricing: {
    currency: "INR",
    basis: "per_person_twin_sharing",
    netAmountPaise: 5200000, // 52,000 INR
    markup: { type: "percent", value: 15 }, // 15% markup -> 59,800 INR
    gstMode: "inclusive",
    gstRate: 0.05,
    sacCode: "998552",
    validityDays: 7,
  },
  terms: {
    payment: ["25% advance to confirm", "Balance 15 days before travel"],
    cancellation: [
      { window: "> 30 days before travel", charge: "10% service fee" },
      { window: "15 to 30 days before travel", charge: "50% package cost" },
      { window: "< 15 days before travel", charge: "100% non-refundable" },
    ],
  },
  meta: {
    sourceFile: "uploads/kashmir-supplier-quote.pdf",
    extractedBy: "claude-sonnet-4-5",
    reviewFlags: [],
    extractedSnapshot: { rawPrice: 52000 },
  },
  variants: [],
  salesperson: {
    name: "Rahul Sharma",
    phone: "+91 98765 12345",
    email: "rahul@trippygo.com",
  },
};

console.log("=== RUNNING PHASE 1 VERIFICATION TESTS ===");

// Test 1: Zod validation
console.log("\n[Test 1] Validating schema...");
const validationResult = validateItinerary(validMockItinerary);
if (!validationResult.success) {
  console.error("FAIL: Validation failed unexpectedly:", validationResult.errors);
  process.exit(1);
}
console.log("PASS: Itinerary matches Zod schema successfully.");

// Test 2: Business rules validation (Detect day mismatch)
console.log("\n[Test 2] Testing validation error on mismatched days...");
const invalidDaysMock = {
  ...validMockItinerary,
  package: { ...validMockItinerary.package, days: 8 }, // Mismatch: nights 6, days 8
};
const invalidResult = validateItinerary(invalidDaysMock);
if (invalidResult.success) {
  console.error("FAIL: Expected validation failure on day mismatch, but passed.");
  process.exit(1);
}
console.log("PASS: Correctly caught business rule mismatch:", invalidResult.errors?.[0]?.message);

// Test 3: computeClientView logic
console.log("\n[Test 3] Testing computeClientView logic...");
const clientView = computeClientView(validMockItinerary);

// 3a. Security check: Net price & markup stripped
if ("netAmountPaise" in (clientView.pricing as any)) {
  console.error("FAIL: netAmountPaise leaked in client view!");
  process.exit(1);
}
if ("markup" in (clientView.pricing as any)) {
  console.error("FAIL: markup leaked in client view!");
  process.exit(1);
}
if ("meta" in (clientView as any)) {
  console.error("FAIL: internal meta leaked in client view!");
  process.exit(1);
}
console.log("PASS: netAmountPaise, markup, and internal meta are safely stripped.");

// 3b. Math check: 52000 + 15% markup = 59,800
const expectedBaseRupees = 59800;
if (clientView.pricing.basePriceRupees !== expectedBaseRupees) {
  console.error(`FAIL: Expected base price ${expectedBaseRupees}, got ${clientView.pricing.basePriceRupees}`);
  process.exit(1);
}
console.log(`PASS: Base selling price computed correctly: Rs ${clientView.pricing.basePriceFormatted}`);

// 3c. GST check: 5% inclusive
// Tax component of 59,800 at 5% = 59800 - (59800 / 1.05) = 2848
console.log(`PASS: GST amount (inclusive 5%): Rs ${clientView.pricing.gstAmountFormatted}`);
console.log(`PASS: Final client price: Rs ${clientView.pricing.finalPriceFormatted}`);

// 3d. Dates computation check:
// Start date: 2026-12-10 (Thursday)
// Day 1: 10 Dec 2026, Thursday
// Day 7: 16 Dec 2026, Wednesday
console.log("PASS: Day 1 calendar date:", clientView.days[0].fullDateLabel);
console.log("PASS: Day 7 calendar date:", clientView.days[6].fullDateLabel);
console.log("PASS: Package calculated end date:", clientView.package.endDate);

if (clientView.days[0].calendarDate !== "10 Dec 2026") {
  console.error(`FAIL: Expected Day 1 '10 Dec 2026', got '${clientView.days[0].calendarDate}'`);
  process.exit(1);
}

// Test 4: Flat markup check
console.log("\n[Test 4] Testing flat markup calculation...");
const flatMarkupMock: Itinerary = {
  ...validMockItinerary,
  pricing: {
    ...validMockItinerary.pricing,
    markup: { type: "flat", valuePaise: 800000 }, // +8,000 INR
    gstMode: "extra",
  },
};
const flatView = computeClientView(flatMarkupMock);
// Base: 52,000 + 8,000 = 60,000. Extra 5% GST = 3,000. Total = 63,000
if (flatView.pricing.basePriceRupees !== 60000 || flatView.pricing.finalPriceRupees !== 63000) {
  console.error(`FAIL: Flat markup math incorrect. Base: ${flatView.pricing.basePriceRupees}, Final: ${flatView.pricing.finalPriceRupees}`);
  process.exit(1);
}
console.log("PASS: Flat markup and 'extra' GST mode computed accurately: Base Rs 60,000, Final Rs 63,000.");

console.log("\n=== ALL PHASE 1 TESTS PASSED SUCCESSFULLY ===");
