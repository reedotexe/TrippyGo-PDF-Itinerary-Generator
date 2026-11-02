import { migrateItinerarySchema } from "../src/lib/schema/migrate";

export function runMigrationUnitTests() {
  console.log("--- UNIT TEST SUITE: SCHEMA MIGRATION ---");

  // 1. Completely bare object
  const minimalDoc: any = {
    package: {
      title: "Minimal Tour",
      destinations: ["Goa"],
      nights: 2,
      days: 3,
    },
    days: [
      { dayNumber: 1, title: "Day 1", description: "Arrive" },
      { dayNumber: 2, title: "Day 2", description: "Explore" },
      { dayNumber: 3, title: "Day 3", description: "Depart" },
    ],
  };

  const migrated1 = migrateItinerarySchema(minimalDoc);
  if (migrated1.schemaVersion !== 2) throw new Error("Expected schemaVersion 2");
  if (migrated1.pricing.netAmountPaise !== 0) throw new Error("Expected default netAmountPaise 0");
  if (migrated1.pricing.markup.type !== "percent") throw new Error("Expected default percent markup");
  if (migrated1.pricing.sacCode !== "998552") throw new Error("Expected default sacCode 998552");

  // 2. Legacy numeric fields conversion
  const legacyPricingDoc: any = {
    ...minimalDoc,
    pricing: {
      netAmount: 75000, // in rupees
      markup: 12,       // scalar number
    },
  };

  const migrated2 = migrateItinerarySchema(legacyPricingDoc);
  if (migrated2.pricing.netAmountPaise !== 7500000) {
    throw new Error(`Expected netAmountPaise 7,500,000, got ${migrated2.pricing.netAmountPaise}`);
  }
  if (migrated2.pricing.markup.type !== "percent" || migrated2.pricing.markup.value !== 12) {
    throw new Error(`Expected markup {type: "percent", value: 12}`);
  }

  // 3. Already valid v2 object passes through cleanly
  const alreadyV2 = migrateItinerarySchema(migrated2);
  if (alreadyV2.schemaVersion !== 2) throw new Error("Expected schemaVersion to remain 2");

  console.log("PASS: All schema migration unit tests passed.\n");
}

if (require.main === module) {
  runMigrationUnitTests();
}
