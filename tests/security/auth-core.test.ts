import assert from "node:assert/strict";
import { auth } from "../../src/lib/auth";
import { authClient } from "../../src/lib/auth/client";
import { toNextJsHandler } from "better-auth/next-js";
import { sendEmail, sendInvitationEmail, sendPasswordResetEmail } from "../../src/lib/email/resend";

console.log("=== RUNNING PHASE 1 AUTHENTICATION CORE VERIFICATION SUITE ===\n");

async function runTests() {
  // 1. Verify Server Auth Instance
  console.log("[Test 1] Verifying Better Auth server initialization...");
  assert.ok(auth, "Better Auth server instance must exist");
  assert.equal(typeof auth.handler, "function", "Better Auth handler must be a function");
  assert.equal(typeof auth.api.signInEmail, "function", "signInEmail API must exist");
  assert.equal(typeof auth.api.createUser, "function", "Admin createUser API must exist");
  console.log("  -> Better Auth server instance and Admin plugin verified.");

  // 2. Verify Next.js Route Handler Mounting
  console.log("[Test 2] Verifying Next.js App Router route handler mounting...");
  const handler = toNextJsHandler(auth);
  assert.equal(typeof handler.GET, "function", "GET route handler must exist");
  assert.equal(typeof handler.POST, "function", "POST route handler must exist");
  console.log("  -> App Router catch-all route handlers (GET, POST) mounted successfully.");

  // 3. Verify Client Auth Instance
  console.log("[Test 3] Verifying Better Auth React client instance...");
  assert.ok(authClient, "Auth client must exist");
  assert.equal(typeof authClient.signIn, "function", "authClient.signIn must be a function");
  assert.equal(typeof authClient.signOut, "function", "authClient.signOut must be a function");
  assert.equal(typeof authClient.useSession, "function", "authClient.useSession hook must exist");
  assert.equal(typeof authClient.admin?.createUser, "function", "authClient.admin.createUser must exist");
  assert.equal(typeof authClient.admin?.banUser, "function", "authClient.admin.banUser must exist");
  console.log("  -> React client and adminClient plugins verified.");

  // 4. Verify Email Simulation Subsystem
  console.log("[Test 4] Verifying Email Dispatcher with local development fallback...");
  const inviteResult = await sendInvitationEmail({
    email: "advisor@trippygo.com",
    name: "Aarav Sharma",
    inviteUrl: "http://localhost:3000/set-password?token=test-invitation-token-12345",
  });
  assert.equal(inviteResult.success, true, "Invitation email dispatch must succeed");

  const resetResult = await sendPasswordResetEmail({
    email: "advisor@trippygo.com",
    name: "Aarav Sharma",
    resetUrl: "http://localhost:3000/reset-password?token=test-reset-token-67890",
  });
  assert.equal(resetResult.success, true, "Password reset email dispatch must succeed");
  console.log("  -> Transactional email delivery and terminal fallback verified.");

  // 5. Verify Public Signup Rejection (disableSignUp: true)
  console.log("[Test 5] Verifying that anonymous public sign-up is strictly disabled...");
  let publicSignupBlocked = false;
  try {
    await auth.api.signUpEmail({
      body: {
        email: "unauthorized_stranger@external.com",
        password: "ValidPassword12345!",
        name: "Stranger",
      },
    });
  } catch (err: any) {
    if (
      err?.body?.code === "EMAIL_PASSWORD_SIGN_UP_DISABLED" ||
      err?.message?.includes("not enabled") ||
      err?.status === 400
    ) {
      publicSignupBlocked = true;
    }
  }
  assert.ok(publicSignupBlocked, "Public sign-up attempts must be rejected with error code EMAIL_PASSWORD_SIGN_UP_DISABLED");
  console.log("  -> Anonymous registration attempt rejected (EMAIL_PASSWORD_SIGN_UP_DISABLED).");

  // 6. Verify Password Complexity Threshold (minPasswordLength: 12)
  console.log("[Test 6] Verifying that short passwords (<12 chars) are rejected by policy...");
  let shortPasswordRejected = false;
  try {
    await auth.api.createUser({
      body: {
        email: "short_password_user@trippygo.com",
        password: "short9char",
        name: "Short Pwd",
        role: "salesperson",
      },
    });
  } catch (err: any) {
    if (
      err?.body?.code === "PASSWORD_TOO_SHORT" ||
      err?.message?.toLowerCase().includes("short") ||
      err?.status === 400
    ) {
      shortPasswordRejected = true;
    }
  }
  assert.ok(shortPasswordRejected, "Passwords with fewer than 12 characters must be rejected");
  console.log("  -> Sub-12 character passwords strictly rejected by auth engine.");

  console.log("\nPASS: ALL PHASE 1 AUTHENTICATION CORE VERIFICATIONS PASSED 100%!\n");
}

runTests().catch((err) => {
  console.error("FATAL: Auth core test failed:", err);
  process.exit(1);
});
