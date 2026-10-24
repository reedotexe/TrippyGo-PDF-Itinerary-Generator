import { NextRequest } from "next/server";
import { POST } from "../src/app/api/extract/route";

async function testExtractRoute() {
  console.log("=== TESTING POST /api/extract ROUTE ===");

  // Test 1: Valid JSON request
  console.log("\n[Test 1] POST with valid JSON text...");
  const validJsonReq = new NextRequest("http://localhost:3000/api/extract", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      text: `Package: Goa 3N4D Beach Break
Day 1: Arrival & Calangute beach
Day 2: North Goa Fort Aguada & Anjuna
Day 3: South Goa church & Mandovi cruise
Day 4: Checkout
Net Price: INR 18,500 for couple`,
    }),
  });

  const res1 = await POST(validJsonReq);
  const data1 = await res1.json();
  if (res1.status !== 200 || !data1.success || !data1.itinerary) {
    console.error("FAIL: Test 1 failed", res1.status, data1);
    process.exit(1);
  }
  console.log("PASS: Status 200 returned, itinerary extracted, source file stored at:", data1.itinerary.meta.sourceFile);

  // Test 2: Missing text in JSON
  console.log("\n[Test 2] POST with empty text in JSON...");
  const emptyJsonReq = new NextRequest("http://localhost:3000/api/extract", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text: "" }),
  });
  const res2 = await POST(emptyJsonReq);
  if (res2.status !== 400) {
    console.error("FAIL: Expected 400, got", res2.status);
    process.exit(1);
  }
  console.log("PASS: Status 400 returned for empty text.");

  // Test 3: Unsupported Content-Type
  console.log("\n[Test 3] POST with unsupported content type...");
  const badTypeReq = new NextRequest("http://localhost:3000/api/extract", {
    method: "POST",
    headers: { "content-type": "image/jpeg" },
    body: "fake image binary",
  });
  const res3 = await POST(badTypeReq);
  if (res3.status !== 415) {
    console.error("FAIL: Expected 415, got", res3.status);
    process.exit(1);
  }
  console.log("PASS: Status 415 returned for unsupported media type.");

  console.log("\n=== ALL POST /api/extract TESTS PASSED ===");
}

testExtractRoute().catch((err) => {
  console.error("Error in testExtractRoute:", err);
  process.exit(1);
});
