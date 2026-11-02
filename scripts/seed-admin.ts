import { auth } from "../src/lib/auth";
import { db, user } from "../src/db";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("=== TRIPPYGO DATABASE AUTH SEEDER ===\n");

  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@trippygo.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "AdminSecurePassword123!";
  const adminName = process.env.SEED_ADMIN_NAME || "Agency Administrator";

  const salesEmail = process.env.SEED_SALES_EMAIL || "sales@trippygo.com";
  const salesPassword = process.env.SEED_SALES_PASSWORD || "SalesSecurePassword123!";
  const salesName = process.env.SEED_SALES_NAME || "Vikram Malhotra";

  try {
    // 1. Verify DB connectivity
    console.log("[1/3] Verifying database connection...");
    const existingAdmins = await db.select().from(user).where(eq(user.email, adminEmail)).limit(1);

    // 2. Seed Admin
    if (existingAdmins.length === 0) {
      console.log(`[2/3] Seeding super-admin: ${adminEmail}...`);
      await auth.api.createUser({
        body: {
          email: adminEmail,
          password: adminPassword,
          name: adminName,
          role: "admin",
        },
      });
      console.log(`  -> Admin created successfully (${adminEmail})`);
    } else {
      console.log(`[2/3] Super-admin already exists (${adminEmail}), skipping creation.`);
    }

    // 3. Seed Salesperson
    const existingSales = await db.select().from(user).where(eq(user.email, salesEmail)).limit(1);
    if (existingSales.length === 0) {
      console.log(`[3/3] Seeding test salesperson: ${salesEmail}...`);
      await auth.api.createUser({
        body: {
          email: salesEmail,
          password: salesPassword,
          name: salesName,
          role: "salesperson",
        },
      });
      console.log(`  -> Salesperson created successfully (${salesEmail})`);
    } else {
      console.log(`[3/3] Test salesperson already exists (${salesEmail}), skipping creation.`);
    }

    console.log("\nPASS: Database seeding completed successfully!");
    process.exit(0);
  } catch (error: any) {
    console.error("\n[Seeding Error]:", error?.message || error);
    console.log("\nNote: Ensure PostgreSQL is running. You can start it via Docker Compose:");
    console.log("  docker compose up -d db");
    process.exit(1);
  }
}

seed();
