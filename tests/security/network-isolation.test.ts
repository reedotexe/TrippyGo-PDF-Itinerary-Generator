import assert from "node:assert/strict";
import { isPrivateOrBlockedHost, isRequestAllowedInRenderer } from "../../src/lib/security/ssrf";

console.log("=== RUNNING NETWORK ISOLATION & SSRF DEFENSE SECURITY SUITE ===\n");

const TARGET_PRINT_URL = "http://localhost:3000/print/itinerary_789?token=mock_hmac_token";

// -------------------------------------------------------------
// Test 1: Identify Private, Loopback and Cloud Metadata IPs
// -------------------------------------------------------------
console.log("[Test 1] Testing isPrivateOrBlockedHost classification...");
// Cloud metadata
assert.equal(isPrivateOrBlockedHost("169.254.169.254"), true, "AWS IMDS must be blocked");
assert.equal(isPrivateOrBlockedHost("169.254.1.1"), true, "Link-local must be blocked");

// Loopback
assert.equal(isPrivateOrBlockedHost("localhost"), true, "localhost must be blocked");
assert.equal(isPrivateOrBlockedHost("127.0.0.1"), true, "127.0.0.1 must be blocked");
assert.equal(isPrivateOrBlockedHost("127.10.20.30"), true, "127.* must be blocked");
assert.equal(isPrivateOrBlockedHost("::1"), true, "IPv6 ::1 must be blocked");
assert.equal(isPrivateOrBlockedHost("[::1]"), true, "IPv6 [::1] must be blocked");
assert.equal(isPrivateOrBlockedHost("0.0.0.0"), true, "0.0.0.0 must be blocked");

// RFC 1918 Private subnets
assert.equal(isPrivateOrBlockedHost("10.0.0.1"), true, "10.0.0.0/8 must be blocked");
assert.equal(isPrivateOrBlockedHost("10.255.255.255"), true);
assert.equal(isPrivateOrBlockedHost("192.168.0.1"), true, "192.168.0.0/16 must be blocked");
assert.equal(isPrivateOrBlockedHost("192.168.100.50"), true);
assert.equal(isPrivateOrBlockedHost("172.16.0.1"), true, "172.16.0.0/12 must be blocked");
assert.equal(isPrivateOrBlockedHost("172.31.255.255"), true, "172.31.255.255 must be blocked");
assert.equal(isPrivateOrBlockedHost("172.32.0.1"), false, "172.32.x is public internet, not RFC 1918");

// Public Internet hosts
assert.equal(isPrivateOrBlockedHost("images.unsplash.com"), false);
assert.equal(isPrivateOrBlockedHost("images.pexels.com"), false);
assert.equal(isPrivateOrBlockedHost("fonts.googleapis.com"), false);
assert.equal(isPrivateOrBlockedHost("8.8.8.8"), false);
console.log("  -> Private and cloud metadata subnets classified accurately.");

// -------------------------------------------------------------
// Test 2: Renderer Request Interception Rules
// -------------------------------------------------------------
console.log("[Test 2] Testing isRequestAllowedInRenderer behavior...");

// 2a. Permitted Requests
assert.equal(
  isRequestAllowedInRenderer(TARGET_PRINT_URL, TARGET_PRINT_URL),
  true,
  "Target print route must be allowed"
);
assert.equal(
  isRequestAllowedInRenderer("http://localhost:3000/_next/static/chunks/main.js", TARGET_PRINT_URL),
  true,
  "Same-origin Next.js static assets must be allowed"
);
assert.equal(
  isRequestAllowedInRenderer("http://localhost:3000/brand/trippygo-logo.png", TARGET_PRINT_URL),
  true,
  "Same-origin brand logo must be allowed"
);
assert.equal(
  isRequestAllowedInRenderer("https://images.unsplash.com/photo-1548013146-72479768bada", TARGET_PRINT_URL),
  true,
  "Public Unsplash images must be allowed"
);
assert.equal(
  isRequestAllowedInRenderer("https://images.pexels.com/photos/123/img.jpg", TARGET_PRINT_URL),
  true,
  "Public Pexels images must be allowed"
);

// 2b. Blocked SSRF & Private Network Requests
assert.equal(
  isRequestAllowedInRenderer("http://169.254.169.254/latest/meta-data/", TARGET_PRINT_URL),
  false,
  "AWS metadata query must be aborted"
);
assert.equal(
  isRequestAllowedInRenderer("http://localhost:8080/admin/db", TARGET_PRINT_URL),
  false,
  "Arbitrary localhost port request must be aborted"
);
assert.equal(
  isRequestAllowedInRenderer("http://127.0.0.1:5432/", TARGET_PRINT_URL),
  false,
  "Postgres port query must be aborted"
);
assert.equal(
  isRequestAllowedInRenderer("http://192.168.1.1/router-login", TARGET_PRINT_URL),
  false,
  "LAN router query must be aborted"
);
assert.equal(
  isRequestAllowedInRenderer("http://10.100.50.2:8000/internal-api", TARGET_PRINT_URL),
  false,
  "Internal VPC microservice query must be aborted"
);

console.log("  -> All SSRF exploitation attempts blocked while permitting authentic print assets.");

console.log("\nPASS: ALL NETWORK ISOLATION & SSRF TESTS PASSED 100%!\n");
