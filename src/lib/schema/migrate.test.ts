import assert from "node:assert/strict";
import { migrateItinerarySchema } from "./migrate";
import { ItinerarySchema } from "./itinerary";

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
assert.deepEqual(migratedV1.package.travellers, { adults: 2, children: 0, rooms: 1 });
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

console.log("\nPASS: ALL SCHEMA MIGRATION TESTS PASSED 100%!\n");
