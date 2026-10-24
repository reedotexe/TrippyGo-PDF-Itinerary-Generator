import {
  getSession,
  hasRole,
  serializeSession,
  DEFAULT_DEV_SESSION,
  DEFAULT_ADMIN_SESSION,
} from "../src/lib/auth/session";
import { migrateItinerarySchema } from "../src/lib/schema/migrate";
import {
  saveItineraryData,
  getItinerary,
  createItineraryVersion,
  getItineraryVersions,
  restoreItineraryVersion,
} from "../src/lib/db/itineraries";
import { uploadPdf, getPresignedDownloadUrl } from "../src/lib/storage/s3";
import { Itinerary } from "../src/lib/schema/itinerary";

async function runPhase7Tests() {
  console.log("=== RUNNING PHASE 7 AUTH, VERSIONING & STORAGE TEST SUITE ===\n");

  // -------------------------------------------------------------
  // TEST 1: Auth Session & Role Governance
  // -------------------------------------------------------------
  console.log("[Test 1] Testing session auth & role governance...");

  const salesSession = DEFAULT_DEV_SESSION;
  const adminSession = DEFAULT_ADMIN_SESSION;

  if (!hasRole(salesSession, "salesperson")) {
    throw new Error("Sales session should have salesperson role");
  }
  if (hasRole(salesSession, "admin")) {
    throw new Error("Sales session should NOT have admin role");
  }
  if (!hasRole(adminSession, "admin") || !hasRole(adminSession, "salesperson")) {
    throw new Error("Admin session should satisfy both admin and salesperson roles");
  }

  const cookieStr = serializeSession(salesSession);
  if (!cookieStr.includes("Vikram Malhotra") || !cookieStr.includes("salesperson")) {
    throw new Error(`Invalid serialized session cookie: ${cookieStr}`);
  }

  // Test getSession with mock request header
  const mockReq = new Request("http://localhost:3000/api/itineraries", {
    headers: { "x-user-role": "admin" },
  });
  const resolvedSession = await getSession(mockReq);
  if (resolvedSession?.role !== "admin") {
    throw new Error(`Expected admin role from x-user-role header, got ${resolvedSession?.role}`);
  }
  console.log("PASS: Session roles, serialization, and header resolution verified.\n");

  // -------------------------------------------------------------
  // TEST 2: Schema Migration Utility (v0 -> v1 Upgrade)
  // -------------------------------------------------------------
  console.log("[Test 2] Testing schema migration utility (v0 to v1)...");

  const legacyV0Itinerary: any = {
    // schemaVersion missing
    package: {
      title: "Legacy Golden Triangle Tour",
      destinations: ["Delhi", "Agra", "Jaipur"],
      nights: 3,
      days: 4,
      startDate: "2026-11-01",
      travellers: { adults: 2, children: 0, rooms: 1 },
    },
    days: [
      {
        dayNumber: 1,
        title: "Delhi to Agra via Yamuna Expressway",
        description: "Drive to Agra, visit Taj Mahal at sunset.",
        activities: ["Taj Mahal sunset"],
        meals: ["Dinner"],
      },
      {
        dayNumber: 2,
        title: "Agra to Jaipur via Fatehpur Sikri",
        description: "Enroute visit Buland Darwaza.",
        activities: ["Fatehpur Sikri"],
        meals: ["Breakfast"],
      },
    ],
    inclusions: ["3 Nights hotel stay", "AC Sedan cab"],
    exclusions: ["Monument entrance fees"],
    pricing: {
      currency: "INR",
      basis: "per_person_twin_sharing",
      netAmount: 35000, // Legacy rupee amount instead of netAmountPaise
      markup: 18, // Legacy numeric markup instead of discriminated union
    },
  };

  const migrated = migrateItinerarySchema(legacyV0Itinerary);

  if (migrated.schemaVersion !== 1) {
    throw new Error(`Expected schemaVersion 1, got ${migrated.schemaVersion}`);
  }
  if (migrated.pricing.netAmountPaise !== 3500000) {
    throw new Error(`Expected netAmountPaise 3,500,000, got ${migrated.pricing.netAmountPaise}`);
  }
  if (migrated.pricing.markup.type !== "percent" || migrated.pricing.markup.value !== 18) {
    throw new Error(`Expected markup {type: "percent", value: 18}, got ${JSON.stringify(migrated.pricing.markup)}`);
  }
  if (migrated.pricing.sacCode !== "998552") {
    throw new Error(`Expected default sacCode 998552, got ${migrated.pricing.sacCode}`);
  }
  if (migrated.pricing.gstMode !== "inclusive") {
    throw new Error(`Expected default gstMode inclusive, got ${migrated.pricing.gstMode}`);
  }
  console.log("PASS: Schema migration utility correctly upgraded legacy unversioned structure to v1.\n");

  // -------------------------------------------------------------
  // TEST 3: Storage & Pre-signed Download URLs
  // -------------------------------------------------------------
  console.log("[Test 3] Testing storage upload & pre-signed download URL generation...");

  const testPdfBuffer = Buffer.from("%PDF-1.4 Mock PDF Content For Testing S3 Storage");
  const testKey = "pdfs/test-audit-itinerary/v1_test.pdf";

  const uploadResult = await uploadPdf(testPdfBuffer, testKey);
  if (!uploadResult.key) {
    throw new Error("Upload result missing key");
  }

  const downloadUrl = await getPresignedDownloadUrl(testKey, 3600);
  if (!downloadUrl || (!downloadUrl.includes("http") && !downloadUrl.includes("/api/storage/download"))) {
    throw new Error(`Invalid download URL returned: ${downloadUrl}`);
  }
  console.log(`PASS: Storage uploaded to key '${uploadResult.key}', download URL: ${downloadUrl}\n`);

  // -------------------------------------------------------------
  // TEST 4: Versioning, Immutable Snapshots & Version Restoration
  // -------------------------------------------------------------
  console.log("[Test 4] Testing versioning, immutable snapshots, and restoration...");

  const testItineraryId = `test-phase7-versioning-${Date.now()}`;

  const v1Itinerary: Itinerary = {
    ...migrated,
    package: { ...migrated.package, title: "Original V1 Package Title" },
    pricing: { ...migrated.pricing, netAmountPaise: 4000000 }, // ₹40,000
  };

  // 4a. Save Initial Draft & Create Version 1
  await saveItineraryData(testItineraryId, v1Itinerary);
  const version1 = await createItineraryVersion(
    testItineraryId,
    v1Itinerary,
    "pdfs/test-phase7-versioning-id/v1_sample.pdf",
    "hash-v1-sha256-mock"
  );

  if (version1.versionNumber !== 1) {
    throw new Error(`Expected version 1, got ${version1.versionNumber}`);
  }

  // 4b. Modify Itinerary Draft & Create Version 2
  const v2Itinerary: Itinerary = {
    ...v1Itinerary,
    package: { ...v1Itinerary.package, title: "Updated V2 Package Title (Discount Applied)" },
    pricing: { ...v1Itinerary.pricing, netAmountPaise: 4800000 }, // ₹48,000
  };

  await saveItineraryData(testItineraryId, v2Itinerary);
  const version2 = await createItineraryVersion(
    testItineraryId,
    v2Itinerary,
    "pdfs/test-phase7-versioning-id/v2_sample.pdf",
    "hash-v2-sha256-mock"
  );

  if (version2.versionNumber !== 2) {
    throw new Error(`Expected version 2, got ${version2.versionNumber}`);
  }

  // 4c. Verify getItineraryVersions returns both in descending order
  const versionsList = await getItineraryVersions(testItineraryId);
  if (versionsList.length < 2) {
    throw new Error(`Expected at least 2 versions, found ${versionsList.length}`);
  }
  if (versionsList[0].versionNumber !== 2 || versionsList[1].versionNumber !== 1) {
    throw new Error("Versions list should be ordered descending by versionNumber");
  }
  if (!versionsList[0].downloadUrl) {
    throw new Error("Version entry should have populated downloadUrl");
  }

  console.log(`  -> Recorded Version 1 and Version 2 successfully.`);

  // 4d. Test Version Restoration: restore Version 1
  console.log("  -> Restoring Version 1 snapshot into active draft...");
  const restored = await restoreItineraryVersion(testItineraryId, 1);
  if (!restored) {
    throw new Error("restoreItineraryVersion returned null");
  }

  // Verify that active draft in store now matches Version 1 title and price
  const currentDraft = await getItinerary(testItineraryId);
  if (!currentDraft) {
    throw new Error("Current draft not found after restore");
  }
  if (currentDraft.package.title !== "Original V1 Package Title") {
    throw new Error(`Expected title 'Original V1 Package Title', got '${currentDraft.package.title}'`);
  }
  if (currentDraft.pricing.netAmountPaise !== 4000000) {
    throw new Error(`Expected restored price 4,000,000 paise, got ${currentDraft.pricing.netAmountPaise}`);
  }

  console.log("PASS: Version restoration succeeded. Active draft reverted to Version 1 state.\n");

  console.log("=== ALL PHASE 7 TESTS PASSED SUCCESSFULLY ===");
}

runPhase7Tests().catch((err) => {
  console.error("FATAL: Phase 7 test failed:", err);
  process.exit(1);
});
