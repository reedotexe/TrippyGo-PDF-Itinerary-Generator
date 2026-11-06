import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { db, verification, user, account } from "@/db";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { recordAuditEvent } from "@/lib/audit/logger";

const localDataDir = path.join(process.cwd(), ".data");
const localTokensFile = path.join(localDataDir, "tokens.json");
const localUsersFile = path.join(localDataDir, "users.json");

export interface VerificationTokenRecord {
  token: string;
  email: string;
  type: "invite" | "reset-password";
  expiresAt: string; // ISO date string
  createdAt: string;
}

function getTokenStore(): Record<string, VerificationTokenRecord> {
  if (!fs.existsSync(localDataDir)) {
    fs.mkdirSync(localDataDir, { recursive: true });
  }
  if (!fs.existsSync(localTokensFile)) {
    fs.writeFileSync(localTokensFile, "{}", "utf8");
    return {};
  }
  try {
    return JSON.parse(fs.readFileSync(localTokensFile, "utf8"));
  } catch {
    return {};
  }
}

function saveTokenStore(store: Record<string, VerificationTokenRecord>) {
  if (!fs.existsSync(localDataDir)) {
    fs.mkdirSync(localDataDir, { recursive: true });
  }
  fs.writeFileSync(localTokensFile, JSON.stringify(store, null, 2), "utf8");
}

/**
 * Persist a verification token in both local storage and PostgreSQL (if connected).
 */
export async function createVerificationToken({
  token,
  email,
  type = "invite",
  expiresInMs = 48 * 60 * 60 * 1000, // 48h default
}: {
  token: string;
  email: string;
  type?: "invite" | "reset-password";
  expiresInMs?: number;
}): Promise<VerificationTokenRecord> {
  const normalizedEmail = email.toLowerCase().trim();
  const expiresAt = new Date(Date.now() + expiresInMs).toISOString();
  const createdAt = new Date().toISOString();

  const record: VerificationTokenRecord = {
    token,
    email: normalizedEmail,
    type,
    expiresAt,
    createdAt,
  };

  // 1. Always save to local store
  const store = getTokenStore();
  store[token] = record;
  saveTokenStore(store);

  // 2. Best-effort insert into PostgreSQL verification table
  try {
    await db.insert(verification).values({
      id: "ver_" + randomUUID(),
      identifier: `reset-password:${token}`,
      value: normalizedEmail,
      expiresAt: new Date(expiresAt),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  } catch {
    // Database offline or credential failure - safe to ignore
  }

  return record;
}

/**
 * Retrieve a verification token if valid and not expired.
 * Checks PostgreSQL first, with fallback to local JSON file store.
 */
export async function getVerificationToken(token: string): Promise<VerificationTokenRecord | null> {
  if (!token) return null;

  // 1. Check PostgreSQL verification table
  try {
    const rows = await db
      .select()
      .from(verification)
      .where(eq(verification.identifier, `reset-password:${token}`))
      .limit(1);

    if (rows.length > 0) {
      const v = rows[0];
      if (new Date(v.expiresAt).getTime() >= Date.now()) {
        let userEmail = v.value;
        // If v.value doesn't have an '@', it could be a userId
        if (!userEmail.includes("@")) {
          const u = await db.select().from(user).where(eq(user.id, v.value)).limit(1);
          if (u.length > 0 && u[0].email) {
            userEmail = u[0].email;
          }
        }
        return {
          token,
          email: userEmail.toLowerCase().trim(),
          type: "reset-password",
          expiresAt: v.expiresAt.toISOString(),
          createdAt: v.createdAt.toISOString(),
        };
      }
    }
  } catch {
    // Database offline, fall through to local store
  }

  // 2. Check local JSON store (.data/tokens.json)
  const store = getTokenStore();
  const record = store[token];
  if (!record) return null;

  if (new Date(record.expiresAt).getTime() < Date.now()) {
    delete store[token];
    saveTokenStore(store);
    return null;
  }

  return record;
}

/**
 * Delete a verification token after single use.
 */
export async function consumeVerificationToken(token: string): Promise<void> {
  if (!token) return;

  // 1. Remove from PostgreSQL
  try {
    await db.delete(verification).where(eq(verification.identifier, `reset-password:${token}`));
  } catch {
    // Ignore DB offline
  }

  // 2. Remove from local store
  const store = getTokenStore();
  delete store[token];
  saveTokenStore(store);
}

/**
 * Set a user's password in PostgreSQL (Supabase) and local dev store.
 * Hashes password using Better Auth's official hasher and syncs account table.
 */
export async function setUserPassword({
  email,
  newPassword,
  req,
}: {
  email: string;
  newPassword: string;
  req?: Request;
}): Promise<boolean> {
  const normalizedEmail = email.toLowerCase().trim();
  let updated = false;

  // 1. Update in PostgreSQL database (Supabase)
  try {
    const dbUsers = await db
      .select()
      .from(user)
      .where(eq(user.email, normalizedEmail))
      .limit(1);

    if (dbUsers.length > 0) {
      const targetUser = dbUsers[0];

      // Hash the password using Better Auth's internal password hasher
      const authCtx = await (auth as any).$context;
      const hashedPassword = await authCtx.password.hash(newPassword);

      // Check if credential account already exists for this user
      const existingAccounts = await db
        .select()
        .from(account)
        .where(
          and(
            eq(account.userId, targetUser.id),
            eq(account.providerId, "credential")
          )
        )
        .limit(1);

      if (existingAccounts.length > 0) {
        await db
          .update(account)
          .set({
            password: hashedPassword,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(account.userId, targetUser.id),
              eq(account.providerId, "credential")
            )
          );
      } else {
        await db.insert(account).values({
          id: randomUUID(),
          accountId: targetUser.id,
          providerId: "credential",
          userId: targetUser.id,
          password: hashedPassword,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      // Ensure user account is active and marked verified
      await db
        .update(user)
        .set({
          banned: false,
          banReason: null,
          emailVerified: true,
          updatedAt: new Date(),
        })
        .where(eq(user.id, targetUser.id));

      updated = true;
    }
  } catch (dbErr) {
    console.error("[setUserPassword] Error updating database password:", dbErr);
  }

  // 2. Update in local store (.data/users.json) for dev fallback
  if (fs.existsSync(localUsersFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(localUsersFile, "utf8"));
      if (data.users) {
        for (const u of Object.values(data.users) as any[]) {
          if (u.email && u.email.toLowerCase() === normalizedEmail) {
            u.password = newPassword;
            u.banned = false; // ensure activated
            u.updatedAt = new Date().toISOString();
            updated = true;
            break;
          }
        }
        if (updated) {
          fs.writeFileSync(localUsersFile, JSON.stringify(data, null, 2), "utf8");
        }
      }
    } catch {
      // ignore
    }
  }

  // 3. Record audit log
  await recordAuditEvent({
    actorId: normalizedEmail,
    action: "user.password_reset",
    targetType: "user",
    targetId: normalizedEmail,
    metadata: { email: normalizedEmail, success: updated },
    req,
  });

  return updated;
}
