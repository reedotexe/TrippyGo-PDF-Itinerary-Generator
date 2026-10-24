import { NextRequest } from "next/server";
import { searchImages, trackUnsplashDownload } from "../src/lib/images/client";
import { GET as searchRoute } from "../src/app/api/images/search/route";
import { POST as downloadRoute } from "../src/app/api/images/download/route";
import { computeClientView } from "../src/lib/schema/client-view";
import { Itinerary } from "../src/lib/schema/itinerary";

async function testPhase4() {
  console.log("=== RUNNING PHASE 4 IMAGE PICKER INTEGRATION TESTS ===");

  // 1. Direct search function
  console.log("\n[Test 1] Testing searchImages('Dal Lake Srinagar')...");
  const images = await searchImages("Dal Lake Srinagar", 1);
  if (!images || images.length === 0) {
    console.error("FAIL: No images returned");
    process.exit(1);
  }
  const first = images[0];
  console.log(`PASS: Found ${images.length} images. First image: "${first.altDescription}" by ${first.photographerName} (${first.provider})`);

  // Verify fields
  if (!first.thumbUrl || !first.fullUrl || !first.photographerName || !first.photographerUrl) {
    console.error("FAIL: Missing required normalized image fields:", first);
    process.exit(1);
  }
  console.log("PASS: All required normalized fields present (thumbUrl, fullUrl, photographerName, photographerUrl).");

  // 2. Cache test (Second call should be instantaneous and identical)
  console.log("\n[Test 2] Testing 10-minute cache behavior...");
  const t0 = Date.now();
  const cachedImages = await searchImages("Dal Lake Srinagar", 1);
  const durationMs = Date.now() - t0;
  if (cachedImages.length !== images.length) {
    console.error("FAIL: Cached result mismatch");
    process.exit(1);
  }
  console.log(`PASS: Cached query returned ${cachedImages.length} items in ${durationMs}ms.`);

  // 3. API Route: GET /api/images/search
  console.log("\n[Test 3] Testing GET /api/images/search?query=Gulmarg...");
  const getReq = new NextRequest("http://localhost:3000/api/images/search?query=Gulmarg");
  const getRes = await searchRoute(getReq);
  const getJson = await getRes.json();

  if (getRes.status !== 200 || !getJson.success || !getJson.images || getJson.images.length === 0) {
    console.error("FAIL: GET /api/images/search failed:", getJson);
    process.exit(1);
  }
  console.log(`PASS: Route returned status 200 with ${getJson.images.length} results.`);

  // 4. API Route: POST /api/images/download (Unsplash tracking)
  console.log("\n[Test 4] Testing POST /api/images/download...");
  const postReq = new NextRequest("http://localhost:3000/api/images/download", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      provider: "unsplash",
      photoId: first.photoId,
      downloadLocation: first.downloadLocation || "https://api.unsplash.com/mock/download",
    }),
  });
  const postRes = await downloadRoute(postReq);
  const postJson = await postRes.json();

  if (postRes.status !== 200 || !postJson.success) {
    console.error("FAIL: POST /api/images/download failed:", postJson);
    process.exit(1);
  }
  console.log("PASS: Unsplash download event tracked successfully.");

  // 5. Verification of image in client view and attribution
  console.log("\n[Test 5] Attaching photo to Itinerary day and verifying client view...");
  const mockItinerary: Itinerary = {
    schemaVersion: 1,
    package: {
      title: "Scenic Kashmir",
      destinations: ["Srinagar"],
      nights: 3,
      days: 4,
      startDate: "2026-12-01",
      travellers: { adults: 2, children: 0, rooms: 1 },
    },
    days: [
      {
        dayNumber: 1,
        title: "Dal Lake Exploration",
        description: "Evening Shikara ride.",
        activities: ["Shikara ride"],
        meals: ["Dinner"],
        stay: { hotel: "Deluxe Houseboat", city: "Srinagar", roomType: null },
        imageQuery: "Dal Lake Srinagar",
        image: {
          provider: first.provider,
          photoId: first.photoId,
          imageUrl: first.fullUrl,
          thumbnailUrl: first.thumbUrl,
          photographerName: first.photographerName,
          photographerUrl: first.photographerUrl,
          downloadLocation: first.downloadLocation,
        },
      },
    ],
    inclusions: ["Houseboat stay"],
    exclusions: ["Airfare"],
    pricing: {
      currency: "INR",
      basis: "per_person_twin_sharing",
      netAmountPaise: 2500000,
      markup: { type: "percent", value: 15 },
      gstMode: "inclusive",
      gstRate: 0.05,
      sacCode: "998552",
      validityDays: 7,
    },
    terms: { payment: ["Advance"], cancellation: [] },
    meta: { sourceFile: null, extractedBy: "test", reviewFlags: [], extractedSnapshot: null },
    variants: [],
  };

  const clientView = computeClientView(mockItinerary);
  const clientDay = clientView.days[0];

  if (!clientDay.image || clientDay.image.photographerName !== first.photographerName) {
    console.error("FAIL: Image attribution missing in client view:", clientDay);
    process.exit(1);
  }
  console.log(`PASS: Image attached cleanly to Day 1. Credit: Photo by ${clientDay.image.photographerName} on ${clientDay.image.provider}`);

  console.log("\n=== ALL PHASE 4 TESTS PASSED SUCCESSFULLY ===");
}

testPhase4().catch((err) => {
  console.error("Error in testPhase4:", err);
  process.exit(1);
});
