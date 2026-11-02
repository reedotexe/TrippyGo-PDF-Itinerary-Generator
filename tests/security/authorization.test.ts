import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { GET as getItinerariesRoute, POST as postItinerariesRoute } from "../../src/app/api/itineraries/route";
import {
  GET as getItineraryByIdRoute,
  PATCH as patchItineraryByIdRoute,
  DELETE as deleteItineraryByIdRoute,
} from "../../src/app/api/itineraries/[id]/route";
import { POST as generatePdfRoute } from "../../src/app/api/itineraries/[id]/generate/route";
import { GET as getAdminSettingsRoute } from "../../src/app/api/admin/settings/route";
import { createEmptyFallbackItinerary } from "../../src/lib/extraction/client";
import { restoreItinerary, reassignItinerary, getItinerary } from "../../src/lib/db/itineraries";

console.log("=== RUNNING PHASE 3 AUTHORIZATION & 404 ANTI-PROBING TEST SUITE ===\n");

function createMockRequest(
  url: string,
  method = "GET",
  user?: { id: string; role: string; banned?: boolean },
  body?: any
): NextRequest {
  const headers = new Headers();
  if (user) {
    headers.set("x-user-id", user.id);
    headers.set("x-user-role", user.role);
    if (user.banned) {
      headers.set("x-user-banned", "true");
    }
  }
  if (body) {
    headers.set("content-type", "application/json");
  }

  return new NextRequest(new URL(url, "http://localhost:3000"), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

async function runTests() {
  const userAlice = { id: "agent_alice", role: "salesperson" };
  const userBob = { id: "agent_bob", role: "salesperson" };
  const userAdmin = { id: "admin_super", role: "admin" };
  const userBanned = { id: "agent_bad", role: "salesperson", banned: true };

  const idAlice = `itn_alice_${Date.now()}`;
  const idBob = `itn_bob_${Date.now()}`;

  // -------------------------------------------------------------
  // Step 1: Create proposals for Alice and Bob
  // -------------------------------------------------------------
  console.log("[Test 1] Creating isolated proposals for Agent Alice and Agent Bob...");
  const dataAlice = createEmptyFallbackItinerary("manual_creation");
  dataAlice.package.title = "Alice Kashmir Honeymoon";

  const reqCreateAlice = createMockRequest("http://localhost:3000/api/itineraries", "POST", userAlice, {
    id: idAlice,
    data: dataAlice,
  });
  const resCreateAlice = await postItinerariesRoute(reqCreateAlice);
  assert.equal(resCreateAlice.status, 200, "Alice should successfully create her proposal");

  const dataBob = createEmptyFallbackItinerary("manual_creation");
  dataBob.package.title = "Bob Ladakh Adventure";

  const reqCreateBob = createMockRequest("http://localhost:3000/api/itineraries", "POST", userBob, {
    id: idBob,
    data: dataBob,
  });
  const resCreateBob = await postItinerariesRoute(reqCreateBob);
  assert.equal(resCreateBob.status, 200, "Bob should successfully create his proposal");
  console.log("  -> Alice and Bob proposals created with distinct ownership.");

  // -------------------------------------------------------------
  // Step 2: 404 Anti-Probing on Cross-User Read (GET)
  // -------------------------------------------------------------
  console.log("[Test 2] Enforcing 404 Anti-Probing: Alice requesting Bob's proposal...");
  const reqAliceProbingBob = createMockRequest(`http://localhost:3000/api/itineraries/${idBob}`, "GET", userAlice);
  const resAliceProbingBob = await getItineraryByIdRoute(reqAliceProbingBob, {
    params: Promise.resolve({ id: idBob }),
  });

  assert.equal(resAliceProbingBob.status, 404, "Cross-user query MUST return 404 Not Found (never 403)");
  const jsonAliceProbingBob = await resAliceProbingBob.json();
  assert.equal(jsonAliceProbingBob.error, "Itinerary not found");

  // Alice can read her own proposal
  const reqAliceOwn = createMockRequest(`http://localhost:3000/api/itineraries/${idAlice}`, "GET", userAlice);
  const resAliceOwn = await getItineraryByIdRoute(reqAliceOwn, {
    params: Promise.resolve({ id: idAlice }),
  });
  assert.equal(resAliceOwn.status, 200, "Alice must be able to read her own proposal");
  console.log("  -> 404 Anti-Probing verified on GET: foreign proposal ID yields 404 Not Found.");

  // -------------------------------------------------------------
  // Step 3: 404 Anti-Probing on Cross-User Mutation (PATCH & DELETE)
  // -------------------------------------------------------------
  console.log("[Test 3] Enforcing 404 Anti-Probing: Alice attempting to edit or delete Bob's proposal...");
  const reqAliceEditBob = createMockRequest(`http://localhost:3000/api/itineraries/${idBob}`, "PATCH", userAlice, {
    data: dataAlice,
  });
  const resAliceEditBob = await patchItineraryByIdRoute(reqAliceEditBob, {
    params: Promise.resolve({ id: idBob }),
  });
  assert.equal(resAliceEditBob.status, 404, "Attempting to edit an unowned proposal MUST return 404");

  const reqAliceDeleteBob = createMockRequest(`http://localhost:3000/api/itineraries/${idBob}`, "DELETE", userAlice);
  const resAliceDeleteBob = await deleteItineraryByIdRoute(reqAliceDeleteBob, {
    params: Promise.resolve({ id: idBob }),
  });
  assert.equal(resAliceDeleteBob.status, 404, "Attempting to delete an unowned proposal MUST return 404");
  console.log("  -> 404 Anti-Probing verified on PATCH & DELETE.");

  // -------------------------------------------------------------
  // Step 4: 404 Anti-Probing on PDF Generation
  // -------------------------------------------------------------
  console.log("[Test 4] Enforcing 404 Anti-Probing on PDF Generation Route...");
  const reqAliceGenBob = createMockRequest(`http://localhost:3000/api/itineraries/${idBob}/generate`, "POST", userAlice);
  const resAliceGenBob = await generatePdfRoute(reqAliceGenBob, {
    params: Promise.resolve({ id: idBob }),
  });
  assert.equal(resAliceGenBob.status, 404, "Generating PDF for unowned proposal MUST reject with 404 (no HMAC minted)");
  console.log("  -> 404 Anti-Probing verified on PDF Generation.");

  // -------------------------------------------------------------
  // Step 5: Dashboard List Scoping (Salesperson vs Admin)
  // -------------------------------------------------------------
  console.log("[Test 5] Verifying Dashboard Proposals List Scoping...");
  const reqListAlice = createMockRequest("http://localhost:3000/api/itineraries", "GET", userAlice);
  const resListAlice = await getItinerariesRoute(reqListAlice);
  const jsonListAlice = await resListAlice.json();
  const aliceIds = jsonListAlice.itineraries.map((it: any) => it.id);
  assert.ok(aliceIds.includes(idAlice), "Alice's list must include Alice's proposal");
  assert.ok(!aliceIds.includes(idBob), "Alice's list MUST NOT include Bob's proposal");

  const reqListAdmin = createMockRequest("http://localhost:3000/api/itineraries", "GET", userAdmin);
  const resListAdmin = await getItinerariesRoute(reqListAdmin);
  const jsonListAdmin = await resListAdmin.json();
  const adminIds = jsonListAdmin.itineraries.map((it: any) => it.id);
  assert.ok(adminIds.includes(idAlice), "Admin list must include Alice's proposal");
  assert.ok(adminIds.includes(idBob), "Admin list must include Bob's proposal");
  console.log("  -> Dashboard list strictly scoped per salesperson; admin retains complete visibility.");

  // -------------------------------------------------------------
  // Step 6: Admin Privilege Guarding (/api/admin/settings)
  // -------------------------------------------------------------
  console.log("[Test 6] Enforcing Admin Privilege Guards...");
  const reqAliceAdmin = createMockRequest("http://localhost:3000/api/admin/settings", "GET", userAlice);
  const resAliceAdmin = await getAdminSettingsRoute(reqAliceAdmin);
  assert.equal(resAliceAdmin.status, 403, "Salesperson must be rejected with 403 Forbidden from admin routes");

  const reqAdminSettings = createMockRequest("http://localhost:3000/api/admin/settings", "GET", userAdmin);
  const resAdminSettings = await getAdminSettingsRoute(reqAdminSettings);
  assert.equal(resAdminSettings.status, 200, "Administrator must be granted access to admin routes");
  console.log("  -> Admin privilege guard verified: 403 Forbidden for staff, 200 for admin.");

  // -------------------------------------------------------------
  // Step 7: Soft Deletion, Trash & Restoration
  // -------------------------------------------------------------
  console.log("[Test 7] Verifying Soft Deletion and Admin Restoration Lifecycle...");
  const reqDeleteAlice = createMockRequest(`http://localhost:3000/api/itineraries/${idAlice}`, "DELETE", userAlice);
  const resDeleteAlice = await deleteItineraryByIdRoute(reqDeleteAlice, {
    params: Promise.resolve({ id: idAlice }),
  });
  assert.equal(resDeleteAlice.status, 200, "Alice should successfully soft-delete her own proposal");

  // Subsequent query by Alice returns 404
  const reqAliceAfterDelete = createMockRequest(`http://localhost:3000/api/itineraries/${idAlice}`, "GET", userAlice);
  const resAliceAfterDelete = await getItineraryByIdRoute(reqAliceAfterDelete, {
    params: Promise.resolve({ id: idAlice }),
  });
  assert.equal(resAliceAfterDelete.status, 404, "Soft-deleted proposal must not be visible on standard GET");

  // Admin can restore the proposal
  const restored = await restoreItinerary(idAlice, userAdmin as any);
  assert.equal(restored, true, "Admin must be able to restore soft-deleted proposals");

  // Alice can now read her proposal again
  const resAliceAfterRestore = await getItineraryByIdRoute(reqAliceOwn, {
    params: Promise.resolve({ id: idAlice }),
  });
  assert.equal(resAliceAfterRestore.status, 200, "Restored proposal must become visible again to owner");
  console.log("  -> Soft-deletion and restoration cycle verified.");

  // -------------------------------------------------------------
  // Step 8: Proposal Reassignment
  // -------------------------------------------------------------
  console.log("[Test 8] Verifying Proposal Reassignment between agents...");
  const reassigned = await reassignItinerary(idBob, "agent_alice", userAdmin as any);
  assert.equal(reassigned, true, "Admin can reassign Bob's proposal to Alice");

  // Alice can now read it
  const reqAliceReadReassigned = createMockRequest(`http://localhost:3000/api/itineraries/${idBob}`, "GET", userAlice);
  const resAliceReadReassigned = await getItineraryByIdRoute(reqAliceReadReassigned, {
    params: Promise.resolve({ id: idBob }),
  });
  assert.equal(resAliceReadReassigned.status, 200, "Alice must now have access to the reassigned proposal");
  console.log("  -> Proposal reassignment verified.");

  // -------------------------------------------------------------
  // Step 9: Real-Time Banned / Deactivated User Rejection
  // -------------------------------------------------------------
  console.log("[Test 9] Verifying Immediate Rejection for Banned Users...");
  const reqBannedUser = createMockRequest("http://localhost:3000/api/itineraries", "GET", userBanned);
  const resBannedUser = await getItinerariesRoute(reqBannedUser);
  assert.equal(resBannedUser.status, 403, "Banned user must be rejected with 403 Forbidden");
  const jsonBanned = await resBannedUser.json();
  assert.ok(jsonBanned.error.toLowerCase().includes("suspended"), "Error message must indicate account suspension");
  console.log("  -> Banned user immediately rejected with 403 Forbidden.");

  console.log("\nPASS: ALL PHASE 3 AUTHORIZATION & 404 ANTI-PROBING TESTS PASSED 100%!\n");
}

runTests().catch((err) => {
  console.error("FATAL: Authorization test failed:", err);
  process.exit(1);
});
