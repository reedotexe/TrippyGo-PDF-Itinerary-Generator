import { auth } from "../src/lib/auth";
import { db, user, account, session } from "../src/db";
import { eq } from "drizzle-orm";

async function main() {
  console.log("=== TRIPPYGO ADMIN ACCOUNT MIGRATION & CLEANUP ===\n");

  const emailsToRemove = ["admin@trippygo.com", "sales@trippygo.com"];
  const targetEmail = "harkiran@trippygo.in";
  const targetName = process.env.SEED_ADMIN_NAME || "Harkiran";
  const targetPassword = process.env.SEED_ADMIN_PASSWORD || "TrippyGo@2026Admin!";

  try {
    // 1. Remove unwanted test / dummy accounts
    console.log("[1/3] Removing unwanted accounts (admin@trippygo.com, sales@trippygo.com)...");
    for (const email of emailsToRemove) {
      const existing = await db.select().from(user).where(eq(user.email, email));
      if (existing.length > 0) {
        for (const u of existing) {
          console.log(`  -> Purging user: ${email} (id: ${u.id})...`);
          await db.delete(session).where(eq(session.userId, u.id));
          await db.delete(account).where(eq(account.userId, u.id));
          await db.delete(user).where(eq(user.id, u.id));
          console.log(`  -> Successfully deleted ${email}`);
        }
      } else {
        console.log(`  -> ${email} not found in database (already clean).`);
      }
    }

    // 2. Create or verify harkiran@trippygo.in
    console.log(`\n[2/3] Setting up super-admin: ${targetEmail}...`);
    const existingTarget = await db.select().from(user).where(eq(user.email, targetEmail)).limit(1);

    if (existingTarget.length === 0) {
      console.log(`  -> Creating user: ${targetEmail}...`);
      await auth.api.createUser({
        body: {
          email: targetEmail,
          password: targetPassword,
          name: targetName,
          role: "admin",
        },
      });
      console.log(`  -> Super-admin account successfully created.`);
    } else {
      console.log(`  -> User ${targetEmail} already exists. Ensuring role is admin and account is active...`);
      await db.update(user).set({ role: "admin", banned: false }).where(eq(user.email, targetEmail));
      console.log(`  -> Role verified as admin.`);
    }

    // 3. Output credentials and summary
    console.log("\n[3/3] Migration Complete! Here are the admin credentials:");
    console.log("=".repeat(60));
    console.log(`Email:    ${targetEmail}`);
    console.log(`Name:     ${targetName}`);
    console.log(`Role:     admin`);
    console.log(`Password: ${targetPassword}`);
    console.log("=".repeat(60));
    console.log("\nYou can now log in at /login with these credentials.");
    console.log("You can also change your password anytime from your profile or the login screen.\n");

    process.exit(0);
  } catch (error: any) {
    console.error("\n[Error during admin migration]:", error?.message || error);
    process.exit(1);
  }
}

main();
