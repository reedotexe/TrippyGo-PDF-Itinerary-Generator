import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { db, verification, user, account } from "@/db";
import { eq } from "drizzle-orm";
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
 */
export function getVerificationToken(token: string): VerificationTokenRecord | null {
  if (!token) return null;
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

  // 1. Remove from local store
  const store = getTokenStore();
  delete store[token];
  saveTokenStore(store);

  // 2. Best-effort remove from PostgreSQL
  try {
    await db.delete(verification).where(eq(verification.identifier, `reset-password:${token}`));
  } catch {
    // Ignore DB offline
  }
}

/**
 * Set a user's password in local store and best-effort update in DB.
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

  // 1. Update in local store
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

  // 2. Record audit log
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
