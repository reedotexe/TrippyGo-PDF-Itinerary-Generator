import { NextRequest } from "next/server";
import { GET as getItineraryRoute, PATCH as patchItineraryRoute } from "../src/app/api/itineraries/[id]/route";
import { POST as generatePdfRoute } from "../src/app/api/itineraries/[id]/generate/route";
import { POST as createItineraryRoute } from "../src/app/api/itineraries/route";
import { computeClientView } from "../src/lib/schema/client-view";

async function testPhase3() {
  console.log("=== RUNNING PHASE 3 END-TO-END INTEGRATION TESTS ===");

  // 1. Create a new itinerary
  console.log("\n[Test 1] POST /api/itineraries (Create initial draft)...");
  const createReq = new NextRequest("http://localhost:3000/api/itineraries", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      data: {
        schemaVersion: 1,
        package: {
          title: "Kashmir 6N7D Adventure",
          destinations: ["Srinagar", "Gulmarg"],
          nights: 6,
          days: 7,
          startDate: "2026-11-15",
          travellers: { adults: 2, children: 0, rooms: 1 },
        },
        days: [
          {
            dayNumber: 1,
            title: "Arrival in Srinagar & Houseboat Check-in",
            description: "Warm welcome at Srinagar airport followed by Shikara ride.",
            activities: ["Shikara ride"],
            meals: ["Dinner"],
            stay: { hotel: "Deluxe Houseboat", city: "Srinagar", roomType: null },
            imageQuery: "Srinagar Dal lake houseboat",
            image: null,
          },
        ],
        inclusions: ["Houseboat stay", "Breakfast & Dinner"],
        exclusions: ["Flights"],
        pricing: {
          currency: "INR",
          basis: "per_person_twin_sharing",
          netAmountPaise: 4000000, // 40,000 INR
          markup: { type: "percent", value: 15 },
          gstMode: "inclusive",
          gstRate: 0.05,
          sacCode: "998552",
          validityDays: 7,
        },
        terms: {
          payment: ["25% advance"],
          cancellation: [{ window: "> 30 days", charge: "10%" }],
        },
        meta: {
          sourceFile: "sample.txt",
          extractedBy: "test",
          reviewFlags: [{ field: "pricing.netAmountPaise", issue: "Review supplier net rate", severity: "warning" }],
          extractedSnapshot: null,
        },
        variants: [],
      },
    }),
  });

  const createRes = await createItineraryRoute(createReq);
  const createJson = await createRes.json();
  const testId = createJson.id;

  if (createRes.status !== 200 || !testId) {
    console.error("FAIL: Could not create itinerary:", createJson);
    process.exit(1);
  }
  console.log(`PASS: Itinerary created with ID: ${testId}`);

  // 2. GET /api/itineraries/[id]
  console.log("\n[Test 2] GET /api/itineraries/[id]...");
  const getReq = new NextRequest(`http://localhost:3000/api/itineraries/${testId}`);
  const getRes = await getItineraryRoute(getReq, { params: Promise.resolve({ id: testId }) });
  const getJson = await getRes.json();

  if (getRes.status !== 200 || getJson.itinerary?.package?.title !== "Kashmir 6N7D Adventure") {
    console.error("FAIL: Could not fetch itinerary:", getJson);
    process.exit(1);
  }
  console.log("PASS: Fetched itinerary successfully. Title:", getJson.itinerary.package.title);

  // 3. PATCH /api/itineraries/[id] (Autosave with updated markup & days)
  console.log("\n[Test 3] PATCH /api/itineraries/[id] (Autosave edit)...");
  const updatedItinerary = {
    ...getJson.itinerary,
    package: { ...getJson.itinerary.package, title: "Kashmir 6N7D Royal Luxury" },
    pricing: {
      ...getJson.itinerary.pricing,
      netAmountPaise: 5000000, // 50,000 INR
      markup: { type: "percent", value: 20 }, // 20% markup -> 60,000 INR
    },
  };

  const patchReq = new NextRequest(`http://localhost:3000/api/itineraries/${testId}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ data: updatedItinerary }),
  });
  const patchRes = await patchItineraryRoute(patchReq, { params: Promise.resolve({ id: testId }) });
  const patchJson = await patchRes.json();

  if (patchRes.status !== 200 || !patchJson.success) {
    console.error("FAIL: PATCH autosave failed:", patchJson);
    process.exit(1);
  }
  console.log("PASS: Autosave succeeded at:", patchJson.updatedAt);

  // 4. POST /api/itineraries/[id]/generate (Generate PDF version)
  console.log("\n[Test 4] POST /api/itineraries/[id]/generate (Version recording)...");
  const genReq = new NextRequest(`http://localhost:3000/api/itineraries/${testId}/generate`, { method: "POST" });
  const genRes = await generatePdfRoute(genReq, { params: Promise.resolve({ id: testId }) });
  const genJson = await genRes.json();

  if (genRes.status !== 200 || !genJson.success || genJson.versionNumber !== 1) {
    console.error("FAIL: Generate PDF route failed:", genJson);
    process.exit(1);
  }
  console.log(`PASS: PDF Version ${genJson.versionNumber} generated. Hash: ${genJson.pdfJsonHash.slice(0, 16)}... URL: ${genJson.pdfUrl}`);

  // 5. Verify Client View Masking on the edited itinerary
  console.log("\n[Test 5] Verify client-view stripping on the updated document...");
  const clientView = computeClientView(updatedItinerary);
  if ("netAmountPaise" in (clientView.pricing as any) || "markup" in (clientView.pricing as any)) {
    console.error("FAIL: Client view leaked netAmountPaise or markup!");
    process.exit(1);
  }
  if (clientView.pricing.finalPriceRupees !== 60000) {
    console.error(`FAIL: Expected final price ₹60,000, got ₹${clientView.pricing.finalPriceRupees}`);
    process.exit(1);
  }
  console.log(`PASS: Final Client Price computed accurately: ₹${clientView.pricing.finalPriceFormatted} (50,000 + 20% markup)`);

  console.log("\n=== ALL PHASE 3 INTEGRATION TESTS PASSED ===");
}

testPhase3().catch((err) => {
  console.error("Error running testPhase3:", err);
  process.exit(1);
});
