import assert from "node:assert/strict";
import { migrateItinerarySchema } from "./migrate";
import { ItinerarySchema } from "./itinerary";
import { computeClientView } from "./client-view";

console.log("=== RUNNING SCHEMA MIGRATION UNIT TEST SUITE ===\n");

// -------------------------------------------------------------
// 1. Unversioned Legacy Document (v0) Upgrade to v1
// -------------------------------------------------------------
console.log("[Test 1] Migrating completely unversioned v0 document...");
const v0Doc = {
  package: {
    title: "Kashmir Winter Odyssey",
    destinations: ["Srinagar", "Gulmarg"],
  },
  days: [
    {
      dayNumber: 1,
      title: "Arrival in Srinagar",
      description: "Transfer to houseboat and Shikara ride.",
    },
  ],
};

const migratedV1 = migrateItinerarySchema(v0Doc);
assert.equal(migratedV1.schemaVersion, 1, "schemaVersion must be upgraded to 1");
assert.equal(migratedV1.package.title, "Kashmir Winter Odyssey");
assert.equal(migratedV1.package.nights, 0, "1-day tour has 0 nights");
assert.equal(migratedV1.package.days, 1, "Days matches 1 day from input array");
assert.deepEqual(migratedV1.package.travellers, { adults: 2, children: 0, infants: 0, rooms: 1 });
assert.equal(migratedV1.pricing.netAmountPaise, 0);
assert.equal(migratedV1.pricing.sacCode, "998552");
assert.equal(migratedV1.pricing.gstMode, "inclusive");
assert.deepEqual(migratedV1.pricing.markup, { type: "percent", value: 15 });
assert.ok(Array.isArray(migratedV1.inclusions));
assert.ok(Array.isArray(migratedV1.exclusions));
assert.ok(Array.isArray(migratedV1.terms.cancellation));
console.log("  -> Unversioned v0 document upgraded to v1 cleanly.");

// -------------------------------------------------------------
// 2. Legacy Rupee Conversion (netAmount -> netAmountPaise)
// -------------------------------------------------------------
console.log("[Test 2] Converting legacy rupee integers to integer paise...");
const legacyRupeeDoc = {
  pricing: {
    netAmount: 48500, // ₹48,500 in rupees
    markup: 12,       // Scalar percentage markup
  },
};

const migratedRupees = migrateItinerarySchema(legacyRupeeDoc);
assert.equal(migratedRupees.pricing.netAmountPaise, 4850000, "₹48,500 must convert to 4,850,000 paise");
assert.equal((migratedRupees.pricing as any).netAmount, undefined, "Legacy netAmount key must be removed");
assert.deepEqual(
  migratedRupees.pricing.markup,
  { type: "percent", value: 12 },
  "Scalar markup 12 must convert to { type: 'percent', value: 12 }"
);
console.log("  -> Legacy rupees and scalar markups normalized.");

// -------------------------------------------------------------
// 3. Flat Markup and Custom Fields Preservation
// -------------------------------------------------------------
console.log("[Test 3] Preserving flat markup and pre-existing v1 configurations...");
const flatMarkupDoc = {
  pricing: {
    netAmountPaise: 3500000,
    markup: { type: "flat", valuePaise: 400000 },
    gstMode: "extra",
    gstRate: 0.05,
    sacCode: "998552",
  },
};

const migratedFlat = migrateItinerarySchema(flatMarkupDoc);
assert.deepEqual(migratedFlat.pricing.markup, { type: "flat", valuePaise: 400000 });
assert.equal(migratedFlat.pricing.gstMode, "extra");
console.log("  -> Flat markup and GST modes preserved.");

// -------------------------------------------------------------
// 4. Missing Days Array Auto-generation
// -------------------------------------------------------------
console.log("[Test 4] Handling completely empty or omitted days array...");
const noDaysDoc = {
  package: { title: "Custom Tour" },
};

const migratedNoDays = migrateItinerarySchema(noDaysDoc);
assert.ok(Array.isArray(migratedNoDays.days));
assert.equal(migratedNoDays.days.length, 1);
assert.equal(migratedNoDays.days[0].dayNumber, 1);
assert.equal(migratedNoDays.days[0].title, "Day 1 Arrival");
console.log("  -> Missing days normalized with valid Day structure.");

// -------------------------------------------------------------
// 5. Idempotency on Already-V1 Documents
// -------------------------------------------------------------
console.log("[Test 5] Idempotency when document is already schemaVersion: 1...");
const alreadyV1 = { ...migratedV1 };
const idempotentRun = migrateItinerarySchema(alreadyV1);
assert.equal(idempotentRun.schemaVersion, 1);
assert.deepEqual(idempotentRun, alreadyV1);
console.log("  -> Already v1 documents pass through idempotently.");

// -------------------------------------------------------------
// 6. Strict Zod Schema Conformance
// -------------------------------------------------------------
console.log("[Test 6] Validating resulting output against Zod ItinerarySchema...");
const validated = ItinerarySchema.safeParse(migratedV1);
assert.equal(validated.success, true, "Migrated document must strictly pass Zod validation");
console.log("  -> Zod schema parse succeeded without warnings.");

// -------------------------------------------------------------
// 7. Error Handling on Invalid Non-Object Inputs
// -------------------------------------------------------------
console.log("[Test 7] Rejecting non-object payloads...");
assert.throws(() => migrateItinerarySchema(null), /Invalid itinerary payload/);
assert.throws(() => migrateItinerarySchema("not an object"), /Invalid itinerary payload/);
assert.throws(() => migrateItinerarySchema(12345), /Invalid itinerary payload/);
console.log("  -> Non-object payloads rejected safely.");

// -------------------------------------------------------------
// 8. Cover Image Schema & Provider Validation (Phase 1)
// -------------------------------------------------------------
console.log("[Test 8] Validating coverImage field, providers (upload, pixabay), and computeClientView...");
assert.equal(migratedV1.package.coverImage, null, "Legacy migration must default coverImage to null");

const docWithCover = {
  ...migratedV1,
  package: {
    ...migratedV1.package,
    coverImage: {
      provider: "upload" as const,
      photoId: "custom-upload-123",
      imageUrl: "data:image/jpeg;base64,/9j/4AAQSkZJRg==",
      thumbnailUrl: null,
      photographerName: "Agent Direct Upload",
      photographerUrl: "",
      downloadLocation: null,
    },
  },
};

const validatedCover = ItinerarySchema.safeParse(docWithCover);
assert.equal(validatedCover.success, true, "Data URI and 'upload' provider must pass Zod validation");

const clientView = computeClientView(docWithCover as any);
assert.equal(
  clientView.package.coverImage?.imageUrl,
  "data:image/jpeg;base64,/9j/4AAQSkZJRg==",
  "computeClientView must pass coverImage through to clientView.package"
);
console.log("  -> coverImage schema, upload provider, and computeClientView pass 100%.");

// -------------------------------------------------------------
// 9. 4-Pillar Package Price Breakup (Flight, Hotel, Land Part, Visa)
// -------------------------------------------------------------
console.log("[Test 9] Validating 4-pillar package price breakup (Flight, Hotel, Land Part, Visa)...");
assert.ok(migratedV1.pricing.breakup, "Migrated document must contain breakup object");
assert.equal(migratedV1.pricing.breakup.flight.included, true);
assert.equal(migratedV1.pricing.breakup.hotel.included, true);
assert.equal(migratedV1.pricing.breakup.landPart.included, true);
assert.equal(migratedV1.pricing.breakup.visa.included, true);

const docWithBreakup = {
  ...migratedV1,
  pricing: {
    ...migratedV1.pricing,
    netAmountPaise: 9500000,
    breakup: {
      flight: { amountPaise: 3000000, included: true, note: "Roundtrip Economy Flights" },
      hotel: { amountPaise: 3500000, included: true, note: "5-Star Luxury Resorts" },
      landPart: { amountPaise: 2500000, included: true, note: "Private Transfers & Tours" },
      visa: { amountPaise: 500000, included: true, note: "Tourist e-Visa Assistance" },
    },
  },
};

const validatedBreakup = ItinerarySchema.safeParse(docWithBreakup);
assert.equal(validatedBreakup.success, true, "Breakup schema must pass Zod validation");

const clientViewWithBreakup = computeClientView(docWithBreakup as any);
assert.equal(clientViewWithBreakup.pricing.breakup.flight.amountRupees, 30000);
assert.equal(clientViewWithBreakup.pricing.breakup.flight.amountFormatted, "30,000");
assert.equal(clientViewWithBreakup.pricing.breakup.hotel.amountRupees, 35000);
assert.equal(clientViewWithBreakup.pricing.breakup.landPart.amountRupees, 25000);
assert.equal(clientViewWithBreakup.pricing.breakup.visa.amountRupees, 5000);
assert.equal(clientViewWithBreakup.pricing.breakup.hasItemizedAmounts, true);
assert.equal(clientViewWithBreakup.pricing.breakup.totalBreakupPaise, 9500000);
console.log("  -> 4-pillar package price breakup validated 100% in schema & client view.");

// -------------------------------------------------------------
// 10. Validating Two Distinct Pricing Types (Supplier vs Custom)
// -------------------------------------------------------------
console.log("[Test 10] Validating Two Distinct Pricing Types (Supplier vs Custom)...");

// 10.A: Supplier Itinerary (DMC Quote + Markup + Optional Flight)
const supplierDoc = {
  ...migratedV1,
  pricing: {
    ...migratedV1.pricing,
    pricingType: "supplier" as const,
    markup: { type: "percent" as const, value: 20 }, // 20% margin
    supplierBreakup: {
      supplierCostPaise: 5000000, // ₹ 50,000 net DMC
      flightIncluded: true,
      flightCostPaise: 2500000, // ₹ 25,000 flight
      flightNote: "Indigo Return DEL-SXR",
      landNote: "DMC Ground Package & Transfers",
    },
  },
};

const validatedSupplier = ItinerarySchema.safeParse(supplierDoc);
assert.equal(validatedSupplier.success, true, "Supplier pricing doc must pass Zod validation");

const clientSupplierView = computeClientView(supplierDoc as any);
// Supplier Cost: 50,000 + 20% Markup (10,000) = Land Selling 60,000
// Flight: 25,000
// Total Base = 85,000
assert.equal(clientSupplierView.pricing.pricingType, "supplier");
assert.equal(clientSupplierView.pricing.finalPriceRupees, 85000);
assert.equal(clientSupplierView.pricing.items.length, 2, "Supplier view must render exactly 2 items: Flight & Land Package");
assert.equal(clientSupplierView.pricing.items[0].key, "flight");
assert.equal(clientSupplierView.pricing.items[0].amountRupees, 25000);
assert.equal(clientSupplierView.pricing.items[1].key, "landPart");
assert.equal(clientSupplierView.pricing.items[1].amountRupees, 60000);
// Crucial: Markup must NEVER be exposed as an item to the client
assert.equal(clientSupplierView.pricing.items.some((i) => i.title.toLowerCase().includes("markup")), false);
console.log("  -> 10.A Supplier Itinerary: Markup strictly hidden, exactly Flight + Land Package rendered.");

// 10.B: Custom Made Itinerary (Itemized: Flight, Land Part, Hotel, Visa - no excluded rows!)
const customDoc = {
  ...migratedV1,
  pricing: {
    ...migratedV1.pricing,
    pricingType: "custom" as const,
    customBreakup: {
      flight: { included: true, amountPaise: 3000000, note: "Indigo DEL-GOA" },
      landPart: { included: true, amountPaise: 2000000, note: "Sightseeing cab" },
      hotel: { included: true, amountPaise: 3500000, note: "5-Star Resort" },
      visa: { included: false, amountPaise: 0, note: "" }, // NOT included!
    },
  },
};

const validatedCustom = ItinerarySchema.safeParse(customDoc);
assert.equal(validatedCustom.success, true, "Custom pricing doc must pass Zod validation");

const clientCustomView = computeClientView(customDoc as any);
// Flight (30,000) + Hotel (35,000) + Land Part (20,000) = 85,000
assert.equal(clientCustomView.pricing.pricingType, "custom");
assert.equal(clientCustomView.pricing.finalPriceRupees, 85000);
assert.equal(clientCustomView.pricing.items.length, 3, "Only included items must appear. Excluded Visa must NOT appear.");
assert.equal(clientCustomView.pricing.items.some((i) => i.key === "visa"), false, "Visa must NOT appear when excluded");
console.log("  -> 10.B Custom Itinerary: Excluded items completely omitted, total strictly matches sum of items.");

// 10.C: Total Only Package (Single price, zero breakups, zero markup)
const totalOnlyDoc = {
  ...migratedV1,
  pricing: {
    ...migratedV1.pricing,
    pricingType: "total_only" as const,
    totalPackagePricePaise: 12500000, // ₹1,25,000
    netAmountPaise: 12500000,
    markup: { type: "percent" as const, value: 0 },
  },
};

const validatedTotalOnly = ItinerarySchema.safeParse(totalOnlyDoc);
assert.equal(validatedTotalOnly.success, true, "Total only pricing doc must pass Zod validation");

const clientTotalOnlyView = computeClientView(totalOnlyDoc as any);
assert.equal(clientTotalOnlyView.pricing.pricingType, "total_only");
assert.equal(clientTotalOnlyView.pricing.finalPriceRupees, 125000);
assert.equal(clientTotalOnlyView.pricing.items.length, 0, "Total only view must have 0 breakup items");
console.log("  -> 10.C Total Only: Lump sum ₹1,25,000, exactly 0 breakup items, zero markup.");

console.log("\nPASS: ALL SCHEMA MIGRATION TESTS PASSED 100%!\n");
