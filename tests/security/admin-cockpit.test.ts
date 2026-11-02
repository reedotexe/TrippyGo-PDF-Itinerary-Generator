import assert from "assert";
import { GET as getUsers, POST as inviteUser } from "@/app/api/admin/users/route";
import { PATCH as updateUser } from "@/app/api/admin/users/[id]/route";
import { GET as getTrash } from "@/app/api/admin/trash/route";
import { POST as restoreItineraryRoute } from "@/app/api/admin/itineraries/[id]/restore/route";
import { PATCH as reassignProposalRoute } from "@/app/api/admin/itineraries/[id]/reassign/route";
import { GET as getAuditRoute } from "@/app/api/admin/audit/route";
import { GET as getItineraries, POST as createItineraryRoute } from "@/app/api/itineraries/route";
import { GET as getItineraryById, DELETE as deleteItineraryRoute } from "@/app/api/itineraries/[id]/route";
import { NextRequest } from "next/server";

function createAdminRequest(url: string, options: { method?: string; body?: any; role?: string; userId?: string } = {}) {
  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  headers.set("x-user-id", options.userId || "usr_admin_1");
  headers.set("x-user-role", options.role || "admin");

  return new NextRequest(new URL(url, "http://localhost:3000"), {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
}

function createSalesRequest(url: string, userId: string, options: { method?: string; body?: any } = {}) {
  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  headers.set("x-user-id", userId);
  headers.set("x-user-role", "salesperson");

  return new NextRequest(new URL(url, "http://localhost:3000"), {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
}

async function runPhase4AdminSuite() {
  console.log("\n=== RUNNING PHASE 4 ADMINISTRATIVE UI & OPERATIONS COCKPIT SUITE ===\n");

  // [Test 1] Query staff directory
  console.log("[Test 1] Querying staff directory via GET /api/admin/users...");
  {
    const req = createAdminRequest("/api/admin/users");
    const res = await getUsers(req);
    assert.strictEqual(res.status, 200, "Admin can query staff users");
    const data = await res.json();
    assert(Array.isArray(data.users), "Returns array of users");
    assert(data.users.length >= 1, "Contains at least 1 administrator");
    console.log(`  -> Fetched ${data.users.length} staff members with itinerary metrics.`);
  }

  // [Test 2] Invite new salesperson
  const uniqueTag = Date.now().toString(36);
  const invitedEmail = `advisor_${uniqueTag}@trippygo.com`;
  let invitedUserId = "";
  console.log(`[Test 2] Inviting new staff member (${invitedEmail})...`);
  {
    const req = createAdminRequest("/api/admin/users", {
      method: "POST",
      body: {
        name: `Advisor ${uniqueTag}`,
        email: invitedEmail,
        role: "salesperson",
      },
    });
    const res = await inviteUser(req);
    assert.strictEqual(res.status, 201, "Invitation dispatches with HTTP 201");
    const data = await res.json();
    assert(data.success, "Invite flagged as success");
    assert(data.inviteUrl && data.inviteUrl.includes("/set-password"), "Single-use invitation URL generated");
    invitedUserId = data.id;
    console.log(`  -> Staff invited successfully: ${invitedUserId} with link: ${data.inviteUrl}`);
  }

  // [Test 3] Create a proposal under Salesperson Alice
  const aliceId = "usr_alice_" + uniqueTag;
  const bobId = "usr_bob_" + uniqueTag;
  const proposalId = "itin_prop_" + uniqueTag;

  console.log(`[Test 3] Setting up test proposals for Agent Alice (${aliceId})...`);
  {
    const req = createSalesRequest("/api/itineraries", aliceId, {
      method: "POST",
      body: {
        id: proposalId,
        package: {
          title: `Maldives Luxury Escape - ${uniqueTag}`,
          destinations: ["Male", "Maafushi"],
          guestName: "Lord Grantham",
          days: 5,
          nights: 4,
        },
        pricing: {
          totalPackagePricePaise: 45000000,
        },
      },
    });
    const res = await createItineraryRoute(req);
    assert([200, 201].includes(res.status), "Proposal created for Alice");

    // Verify Alice sees it
    const aliceGetReq = createSalesRequest(`/api/itineraries/${proposalId}`, aliceId);
    const aliceGetRes = await getItineraryById(aliceGetReq, { params: Promise.resolve({ id: proposalId }) });
    assert.strictEqual(aliceGetRes.status, 200, "Alice has access to her proposal");

    // Verify Bob does NOT see it (404 Anti-probing)
    const bobGetReq = createSalesRequest(`/api/itineraries/${proposalId}`, bobId);
    const bobGetRes = await getItineraryById(bobGetReq, { params: Promise.resolve({ id: proposalId }) });
    assert.strictEqual(bobGetRes.status, 404, "Bob cannot see Alice's proposal (404 Anti-probing)");
    console.log("  -> Alice proposal created and Bob strictly isolated (404).");
  }

  // [Test 4] Reassign proposal from Alice to Bob
  console.log(`[Test 4] Admin reassigning proposal from Alice to Bob (${bobId})...`);
  {
    // First ensure bob is in staff store
    const inviteBobReq = createAdminRequest("/api/admin/users", {
      method: "POST",
      body: {
        name: `Bob Agent ${uniqueTag}`,
        email: `bob_${uniqueTag}@trippygo.com`,
        role: "salesperson",
      },
    });
    const bobRes = await inviteUser(inviteBobReq);
    const bobData = await bobRes.json();
    const actualBobId = bobData.id;

    // Reassign
    const reassignReq = createAdminRequest(`/api/admin/itineraries/${proposalId}/reassign`, {
      method: "PATCH",
      body: { newOwnerId: actualBobId },
    });
    const reassignRes = await reassignProposalRoute(reassignReq, { params: Promise.resolve({ id: proposalId }) });
    assert.strictEqual(reassignRes.status, 200, "Reassignment successful");

    // Now Alice querying it receives 404
    const aliceCheckReq = createSalesRequest(`/api/itineraries/${proposalId}`, aliceId);
    const aliceCheckRes = await getItineraryById(aliceCheckReq, { params: Promise.resolve({ id: proposalId }) });
    assert.strictEqual(aliceCheckRes.status, 404, "Alice can no longer see reassigned proposal (404)");

    // And Bob querying it receives 200!
    const bobCheckReq = createSalesRequest(`/api/itineraries/${proposalId}`, actualBobId);
    const bobCheckRes = await getItineraryById(bobCheckReq, { params: Promise.resolve({ id: proposalId }) });
    assert.strictEqual(bobCheckRes.status, 200, "Bob now owns the proposal and can access it (200)");
    console.log("  -> Proposal visibility shifted instantaneously between advisor workbenches.");
  }

  // [Test 5] Soft-Delete, Trash Inspection & Restore Lifecycle
  console.log(`[Test 5] Testing Soft-Delete, Trash View & Restoration lifecycle...`);
  {
    // Soft-delete the proposal as admin
    const delReq = createAdminRequest(`/api/itineraries/${proposalId}`, { method: "DELETE" });
    const delRes = await deleteItineraryRoute(delReq, { params: Promise.resolve({ id: proposalId }) });
    assert.strictEqual(delRes.status, 200, "Proposal soft-deleted");

    // Inspect Trash
    const trashReq = createAdminRequest("/api/admin/trash");
    const trashRes = await getTrash(trashReq);
    assert.strictEqual(trashRes.status, 200, "Trash ledger fetched");
    const trashData = await trashRes.json();
    const trashedItem = trashData.itineraries.find((it: any) => it.id === proposalId);
    assert(trashedItem, "Soft-deleted proposal present in trash ledger");
    assert(trashedItem.deletedAt, "deletedAt timestamp populated");
    console.log(`  -> Proposal located in /admin/trash with deletion timestamp: ${trashedItem.deletedAt}`);

    // Restore proposal
    const restoreReq = createAdminRequest(`/api/admin/itineraries/${proposalId}/restore`, { method: "POST" });
    const restoreRes = await restoreItineraryRoute(restoreReq, { params: Promise.resolve({ id: proposalId }) });
    assert.strictEqual(restoreRes.status, 200, "Restore call succeeded");

    // Verify it is no longer in trash
    const trashAfterReq = createAdminRequest("/api/admin/trash");
    const trashAfterRes = await getTrash(trashAfterReq);
    const trashAfterData = await trashAfterRes.json();
    assert(!trashAfterData.itineraries.some((it: any) => it.id === proposalId), "Restored proposal removed from trash");
    console.log("  -> Soft-delete and restoration lifecycle validated 100%.");
  }

  // [Test 6] Last Active Admin Protection
  console.log(`[Test 6] Enforcing safety rule: Last active administrator protection...`);
  {
    // Find the primary admin
    const usersReq = createAdminRequest("/api/admin/users");
    const usersRes = await getUsers(usersReq);
    const { users } = await usersRes.json();
    const adminUser = users.find((u: any) => u.role === "admin" && !u.banned);
    assert(adminUser, "At least 1 active admin exists");

    // Try to demote the primary admin
    const demoteReq = createAdminRequest(`/api/admin/users/${adminUser.id}`, {
      method: "PATCH",
      body: { role: "salesperson" },
    });
    const demoteRes = await updateUser(demoteReq, { params: Promise.resolve({ id: adminUser.id }) });
    assert.strictEqual(demoteRes.status, 400, "Demoting last active admin rejected with HTTP 400");
    const demoteBody = await demoteRes.json();
    assert(
      demoteBody.error.includes("last remaining active administrator"),
      "Descriptive error message explains protection policy"
    );

    // Try to ban/deactivate the primary admin
    const banReq = createAdminRequest(`/api/admin/users/${adminUser.id}`, {
      method: "PATCH",
      body: { banned: true },
    });
    const banRes = await updateUser(banReq, { params: Promise.resolve({ id: adminUser.id }) });
    assert.strictEqual(banRes.status, 400, "Deactivating last active admin rejected with HTTP 400");
    console.log("  -> Protection verified: Deactivation & demotion of last active admin blocked strictly.");
  }

  // [Test 7] Audit Trail Verification
  console.log(`[Test 7] Verifying audit ledger records via GET /api/admin/audit...`);
  {
    const auditReq = createAdminRequest("/api/admin/audit");
    const auditRes = await getAuditRoute(auditReq);
    assert.strictEqual(auditRes.status, 200, "Audit route returns 200");
    const auditData = await auditRes.json();
    assert(Array.isArray(auditData.logs), "Returns logs array");
    const actions = auditData.logs.map((l: any) => l.action);

    assert(actions.includes("user.invite"), "Audit ledger contains user.invite event");
    assert(actions.includes("itinerary.reassign"), "Audit ledger contains itinerary.reassign event");
    assert(actions.includes("itinerary.soft_delete"), "Audit ledger contains itinerary.soft_delete event");
    assert(actions.includes("itinerary.restore"), "Audit ledger contains itinerary.restore event");
    console.log(`  -> Audit ledger verified with ${auditData.logs.length} logged operations.`);
  }

  console.log("\nPASS: ALL PHASE 4 ADMINISTRATIVE UI & OPERATIONS COCKPIT TESTS PASSED 100%!\n");
}

runPhase4AdminSuite().catch((err) => {
  console.error("Test Suite Failed:", err);
  process.exit(1);
});
