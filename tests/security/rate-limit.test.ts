import assert from "node:assert/strict";
import { checkRateLimit, createRateLimitResponse } from "../../src/lib/security/rate-limit";

console.log("=== RUNNING RATE LIMITING SECURITY TEST SUITE ===\n");

// -------------------------------------------------------------
// Test 1: POST /api/extract (10 requests/hour per user)
// -------------------------------------------------------------
console.log("[Test 1] Testing POST /api/extract quota (max 10 / hour)...");
const extractUser = "user_extract_test_100";
const extractConfig = { maxRequests: 10, windowMs: 60 * 60 * 1000 };

// First 10 requests must all be allowed
for (let i = 1; i <= 10; i++) {
  const result = checkRateLimit(extractUser, extractConfig);
  assert.equal(result.allowed, true, `Request ${i} should be permitted`);
  assert.equal(result.remaining, 10 - i);
}

// 11th request must be throttled (allowed: false)
const extractThrottled = checkRateLimit(extractUser, extractConfig);
assert.equal(extractThrottled.allowed, false, "11th request must be throttled");
assert.equal(extractThrottled.remaining, 0);
assert.ok(extractThrottled.resetInSeconds > 0, "Reset seconds must be > 0");

const extractResponse = createRateLimitResponse(extractThrottled.resetInSeconds);
assert.equal(extractResponse.status, 429, "HTTP status must be 429 Too Many Requests");
assert.equal(
  extractResponse.headers.get("Retry-After"),
  extractThrottled.resetInSeconds.toString()
);
console.log("  -> POST /api/extract rate limit strictly enforced at 10 req/hr (HTTP 429 returned).");

// -------------------------------------------------------------
// Test 2: POST /api/itineraries/[id]/generate (20 requests/hour per user)
// -------------------------------------------------------------
console.log("[Test 2] Testing PDF Generation route quota (max 20 / hour)...");
const generateUser = "user_generate_test_200";
const generateConfig = { maxRequests: 20, windowMs: 60 * 60 * 1000 };

for (let i = 1; i <= 20; i++) {
  const result = checkRateLimit(generateUser, generateConfig);
  assert.equal(result.allowed, true);
  assert.equal(result.remaining, 20 - i);
}

// 21st request throttled
const genThrottled = checkRateLimit(generateUser, generateConfig);
assert.equal(genThrottled.allowed, false);
assert.equal(genThrottled.remaining, 0);
console.log("  -> PDF generation rate limit strictly enforced at 20 req/hr.");

// -------------------------------------------------------------
// Test 3: GET /api/images/search (100 requests/hour per user)
// -------------------------------------------------------------
console.log("[Test 3] Testing Image Search route quota (max 100 / hour)...");
const imageUser = "user_images_test_300";
const imageConfig = { maxRequests: 100, windowMs: 60 * 60 * 1000 };

for (let i = 1; i <= 100; i++) {
  const result = checkRateLimit(imageUser, imageConfig);
  assert.equal(result.allowed, true);
}

// 101st request throttled
const imgThrottled = checkRateLimit(imageUser, imageConfig);
assert.equal(imgThrottled.allowed, false);
assert.equal(imgThrottled.remaining, 0);
console.log("  -> Image search rate limit strictly enforced at 100 req/hr.");

// -------------------------------------------------------------
// Test 4: Isolation Across Distinct Clients
// -------------------------------------------------------------
console.log("[Test 4] Ensuring rate-limit isolation between different clients...");
const userA = "client_alpha";
const userB = "client_beta";
const quotaConfig = { maxRequests: 2, windowMs: 10000 };

checkRateLimit(userA, quotaConfig);
checkRateLimit(userA, quotaConfig);
const aBlocked = checkRateLimit(userA, quotaConfig);
assert.equal(aBlocked.allowed, false, "User A should be blocked after 2 requests");

const bAllowed = checkRateLimit(userB, quotaConfig);
assert.equal(bAllowed.allowed, true, "User B should not be affected by User A's rate limit");
console.log("  -> Client quotas are fully isolated.");

console.log("\nPASS: ALL RATE LIMITING SECURITY TESTS PASSED 100%!\n");
