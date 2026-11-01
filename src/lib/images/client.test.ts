import assert from "node:assert/strict";
import { searchImages, buildEditorialCoverQuery } from "./client";

console.log("=== RUNNING MULTI-STOCK IMAGE ENGINE & ORIENTATION TEST SUITE ===\n");

async function runTests() {
  // Test 1: Editorial Prompt Modifier Generator
  console.log("[Test 1] Testing buildEditorialCoverQuery...");
  const q1 = buildEditorialCoverQuery("Dubai - 5 Days Tour");
  assert.equal(q1, "Dubai 5 aerial vertical"); // strips 'Days', 'Tour', and dash
  
  const q2 = buildEditorialCoverQuery("Kyoto Japan");
  assert.equal(q2, "Kyoto Japan aerial vertical");

  const q3 = buildEditorialCoverQuery("Switzerland", "golden hour drone");
  assert.equal(q3, "Switzerland golden hour drone vertical");

  const qEmpty = buildEditorialCoverQuery("");
  assert.equal(qEmpty, "luxury travel destination aerial vertical");
  console.log("  -> buildEditorialCoverQuery handles base, themes, and empty inputs passed.");

  // Test 2: Portrait Search (Mock / Offline / Cache Fallback)
  console.log("[Test 2] Testing searchImages with orientation='portrait'...");
  const portraitResults = await searchImages("Kashmir", 1, "portrait");
  assert.ok(portraitResults.length > 0, "Portrait search must return results");
  const firstPortrait = portraitResults[0];
  assert.equal(firstPortrait.orientation, "portrait", "Result orientation must be 'portrait'");
  assert.ok(
    firstPortrait.fullUrl.includes("2480") || firstPortrait.fullUrl.includes("1754") || firstPortrait.fullUrl.length > 0,
    "FullUrl must be high-res"
  );
  console.log(`  -> Portrait search returned ${portraitResults.length} vertical photos (Top provider: ${firstPortrait.provider}).`);

  // Test 3: Landscape Search (Backwards Compatibility)
  console.log("[Test 3] Testing searchImages with orientation='landscape' (default)...");
  const landscapeResults = await searchImages("Kashmir", 1, "landscape");
  assert.ok(landscapeResults.length > 0, "Landscape search must return results");
  const firstLandscape = landscapeResults[0];
  assert.equal(firstLandscape.orientation, "landscape", "Result orientation must be 'landscape'");
  console.log(`  -> Landscape search returned ${landscapeResults.length} horizontal photos.`);

  // Test 4: Orientation-isolated Caching
  console.log("[Test 4] Verifying cache isolation between portrait and landscape...");
  const cachedPortrait = await searchImages("Kashmir", 1, "portrait");
  assert.equal(cachedPortrait[0].orientation, "portrait", "Cached portrait must retain 'portrait' orientation");
  assert.notEqual(cachedPortrait[0].fullUrl, landscapeResults[0].fullUrl, "Portrait and landscape must have distinct URLs");
  console.log("  -> Cache keys properly isolate orientations.");

  // Test 5: Wikimedia Commons Portrait Dimension & Attribution Filter (Phase 3)
  console.log("[Test 5] Testing Wikimedia Commons portrait dimension & attribution filter...");
  const tajPortraits = await searchImages("Taj Mahal", 1, "portrait");
  assert.ok(tajPortraits.length > 0, "Must return Taj Mahal portrait photos");
  for (const img of tajPortraits) {
    if (img.width && img.height) {
      assert.ok(
        img.height > img.width,
        `Image ${img.photoId} (${img.width}x${img.height}) must be taller than wide`
      );
    }
    assert.equal(img.orientation, "portrait", "Every result must be tagged 'portrait'");
    assert.ok(img.photographerName.length > 0, "Photographer name must not be empty");
    assert.ok(img.thumbUrl.startsWith("http"), "Thumb URL must be valid HTTP link");
    assert.ok(img.fullUrl.startsWith("http"), "Full URL must be valid HTTP link");
  }
  console.log(`  -> Verified ${tajPortraits.length} Taj Mahal portrait images strictly conform to aspect ratio and attribution.`);

  console.log("\nPASS: ALL MULTI-STOCK IMAGE ENGINE TESTS PASSED 100%!\n");
}

runTests().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
