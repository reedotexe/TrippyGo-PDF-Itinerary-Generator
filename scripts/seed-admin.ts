import dotenv from "dotenv";
import path from "path";

// Load environment variables before importing database connection
dotenv.config({ path: path.resolve(process.cwd(), ".env.production") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function seed() {
  console.log("=== TRIPPYGO DATABASE AUTH SEEDER ===\n");

  const adminEmail = process.env.SEED_ADMIN_EMAIL || "harkiran@trippygo.in";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "TrippyGo@2026Admin!";
  const adminName = process.env.SEED_ADMIN_NAME || "Harkiran";

  try {
    const { auth } = await import("../src/lib/auth");
    const { db, user } = await import("../src/db");
    const { eq } = await import("drizzle-orm");

    // 1. Verify DB connectivity
    console.log("[1/2] Verifying database connection...");
    const existingAdmins = await db.select().from(user).where(eq(user.email, adminEmail)).limit(1);

    // 2. Seed Super Admin
    if (existingAdmins.length === 0) {
      console.log(`[2/2] Seeding super-admin: ${adminEmail}...`);
      await auth.api.createUser({
        body: {
          email: adminEmail,
          password: adminPassword,
          name: adminName,
          role: "admin",
        },
      });
      console.log(`  -> Super-admin created successfully (${adminEmail})`);
    } else {
      console.log(`[2/2] Super-admin already exists (${adminEmail}), ensuring active admin status.`);
      await db.update(user).set({ role: "admin", banned: false }).where(eq(user.email, adminEmail));
    }

    // Optional: Only seed test salesperson if explicitly requested
    if (process.env.SEED_TEST_SALES === "true") {
      const salesEmail = process.env.SEED_SALES_EMAIL || "sales@trippygo.in";
      const salesPassword = process.env.SEED_SALES_PASSWORD || "SalesSecurePassword123!";
      const salesName = process.env.SEED_SALES_NAME || "Sales Advisor";

      const existingSales = await db.select().from(user).where(eq(user.email, salesEmail)).limit(1);
      if (existingSales.length === 0) {
        console.log(`Seeding test salesperson: ${salesEmail}...`);
        await auth.api.createUser({
          body: {
            email: salesEmail,
            password: salesPassword,
            name: salesName,
            role: "salesperson",
          },
        });
        console.log(`  -> Salesperson created successfully (${salesEmail})`);
      }
    }

    console.log("\nPASS: Database seeding completed successfully!");
    console.log(`Admin email: ${adminEmail}\n`);
    process.exit(0);
  } catch (error: any) {
    console.error("\n[Seeding Error]:", error?.message || error);
    process.exit(1);
  }
}

seed();
