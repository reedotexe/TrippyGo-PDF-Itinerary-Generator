import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { db, user, itineraries } from "@/db";
import { eq, and, isNull } from "drizzle-orm";
import { sendInvitationEmail, sendPasswordResetEmail } from "@/lib/email/resend";
import { recordAuditEvent } from "@/lib/audit/logger";
import { AuthenticatedUser } from "@/lib/auth/guard";
import { auth } from "@/lib/auth";
import { createVerificationToken } from "@/lib/auth/tokens";

export interface StaffUserSummary {
  id: string;
  name: string;
  email: string;
  role: "admin" | "salesperson";
  banned: boolean;
  banReason?: string | null;
  createdAt: string;
  updatedAt: string;
  itineraryCount: number;
}

const localDataDir = path.join(process.cwd(), ".data");
const localUsersFile = path.join(localDataDir, "users.json");

interface LocalUserStore {
  users: Record<
    string,
    {
      id: string;
      name: string;
      email: string;
      role: "admin" | "salesperson";
      banned?: boolean;
      banReason?: string | null;
      createdAt: string;
      updatedAt: string;
    }
  >;
}

function getLocalUsers(): LocalUserStore {
  if (!fs.existsSync(localDataDir)) {
    fs.mkdirSync(localDataDir, { recursive: true });
  }
  if (!fs.existsSync(localUsersFile)) {
    const initial: LocalUserStore = {
      users: {
        usr_admin_1: {
          id: "usr_admin_1",
          name: "Agency Administrator",
          email: "admin@trippygo.com",
          role: "admin",
          banned: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        usr_sales_1: {
          id: "usr_sales_1",
          name: "Vikram Malhotra",
          email: "sales@trippygo.com",
          role: "salesperson",
          banned: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
    };
    fs.writeFileSync(localUsersFile, JSON.stringify(initial, null, 2), "utf8");
    return initial;
  }
  try {
    return JSON.parse(fs.readFileSync(localUsersFile, "utf8"));
  } catch {
    return { users: {} };
  }
}

function saveLocalUsers(store: LocalUserStore) {
  if (!fs.existsSync(localDataDir)) {
    fs.mkdirSync(localDataDir, { recursive: true });
  }
  fs.writeFileSync(localUsersFile, JSON.stringify(store, null, 2), "utf8");
}

/**
 * List all agency staff members and attach their active proposal count.
 */
export async function listStaffUsers(): Promise<StaffUserSummary[]> {
  // 1. Try PostgreSQL
  try {
    const userRows = await db.select().from(user).orderBy(user.createdAt);
    if (userRows && userRows.length > 0) {
      // Query itinerary counts per owner
      const allItins = await db
        .select({ id: itineraries.id, ownerId: itineraries.ownerId })
        .from(itineraries)
        .where(isNull(itineraries.deletedAt));

      const countMap: Record<string, number> = {};
      for (const row of allItins) {
        if (row.ownerId) {
          countMap[row.ownerId] = (countMap[row.ownerId] || 0) + 1;
        }
      }

      return userRows.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: (u.role === "admin" ? "admin" : "salesperson") as "admin" | "salesperson",
        banned: !!u.banned,
        banReason: u.banReason,
        createdAt: u.createdAt.toISOString(),
        updatedAt: u.updatedAt.toISOString(),
        itineraryCount: countMap[u.id] || 0,
      }));
    }
  } catch {
    // DB offline, fall through to local fallback
  }

  // 2. Local fallback
  const store = getLocalUsers();
  const localItinsFile = path.join(localDataDir, "itineraries.json");
  const countMap: Record<string, number> = {};
  if (fs.existsSync(localItinsFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(localItinsFile, "utf8"));
      for (const it of Object.values(data.itineraries || {}) as any[]) {
        if (!it.deletedAt && it.ownerId) {
          countMap[it.ownerId] = (countMap[it.ownerId] || 0) + 1;
        }
      }
    } catch {
      // ignore
    }
  }

  return Object.values(store.users).map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    banned: !!u.banned,
    banReason: u.banReason,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
    itineraryCount: countMap[u.id] || 0,
  }));
}

/**
 * Invite a new staff user.
 * Generates account and invitation URL with 48h validity.
 */
export async function inviteStaffUser({
  name,
  email,
  role = "salesperson",
  adminUser,
  req,
}: {
  name: string;
  email: string;
  role?: "admin" | "salesperson";
  adminUser: AuthenticatedUser;
  req?: Request;
}): Promise<{ id: string; email: string; inviteUrl: string }> {
  const normalizedEmail = email.toLowerCase().trim();
  const tempPassword = "Tmp!" + randomUUID() + "1a";

  let createdId = "";
  const token = randomUUID();
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.BETTER_AUTH_URL ||
    "http://localhost:3000";
  const inviteUrl = `${appUrl}/set-password?token=${token}&email=${encodeURIComponent(normalizedEmail)}`;

  // Persist token for single-use activation
  await createVerificationToken({
    token,
    email: normalizedEmail,
    type: "invite",
    expiresInMs: 48 * 60 * 60 * 1000, // 48 hours
  });

  // 1. Try Better Auth / DB
  try {
    const existing = await db
      .select()
      .from(user)
      .where(eq(user.email, normalizedEmail))
      .limit(1);

    if (existing.length > 0) {
      throw new Error(`A user with email '${normalizedEmail}' already exists.`);
    }

    const created = await auth.api.createUser({
      body: {
        email: normalizedEmail,
        password: tempPassword,
        name,
        role,
      },
    });

    if (created && created.user) {
      createdId = created.user.id;
    }
  } catch (err: any) {
    if (err.message && err.message.includes("already exists")) {
      throw err;
    }
    // DB offline, fallback to local store
    const store = getLocalUsers();
    const existing = Object.values(store.users).find((u) => u.email === normalizedEmail);
    if (existing) {
      throw new Error(`A user with email '${normalizedEmail}' already exists.`);
    }
    createdId = "usr_" + randomUUID().slice(0, 8);
    store.users[createdId] = {
      id: createdId,
      name,
      email: normalizedEmail,
      role,
      banned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveLocalUsers(store);
  }

  // Send invitation email
  await sendInvitationEmail({
    email: normalizedEmail,
    name,
    inviteUrl,
  });

  // Record audit log
  await recordAuditEvent({
    actorId: adminUser.id,
    action: "user.invite",
    targetType: "user",
    targetId: createdId || normalizedEmail,
    metadata: { name, email: normalizedEmail, role },
    req,
  });

  return {
    id: createdId,
    email: normalizedEmail,
    inviteUrl,
  };
}

/**
 * Update staff member role or deactivation status.
 * Enforces rule: Cannot deactivate or demote the last remaining active administrator.
 */
export async function updateStaffUser({
  userId,
  role,
  banned,
  banReason,
  adminUser,
  req,
}: {
  userId: string;
  role?: "admin" | "salesperson";
  banned?: boolean;
  banReason?: string;
  adminUser: AuthenticatedUser;
  req?: Request;
}): Promise<StaffUserSummary> {
  const staff = await listStaffUsers();
  const target = staff.find((u) => u.id === userId);

  if (!target) {
    throw new Error(`Staff user not found.`);
  }

  // Safety check: Last active administrator protection
  const activeAdmins = staff.filter((u) => u.role === "admin" && !u.banned);
  const isTargetActiveAdmin = target.role === "admin" && !target.banned;
  const isDemotingOrBanning =
    (role && role !== "admin" && isTargetActiveAdmin) ||
    (banned === true && isTargetActiveAdmin);

  if (isDemotingOrBanning && activeAdmins.length <= 1) {
    throw new Error("Cannot deactivate or demote the last remaining active administrator.");
  }

  const now = new Date();
  const newRole = role !== undefined ? role : target.role;
  const newBanned = banned !== undefined ? banned : target.banned;
  const newBanReason = banned ? banReason || "Deactivated by administrator" : null;

  // 1. Try DB
  try {
    await db
      .update(user)
      .set({
        role: newRole,
        banned: newBanned,
        banReason: newBanReason,
        updatedAt: now,
      })
      .where(eq(user.id, userId));
  } catch {
    // DB offline
  }

  // 2. Always sync local store
  const store = getLocalUsers();
  if (store.users[userId]) {
    store.users[userId].role = newRole;
    store.users[userId].banned = newBanned;
    store.users[userId].banReason = newBanReason;
    store.users[userId].updatedAt = now.toISOString();
    saveLocalUsers(store);
  }

  // Record audit events
  if (role !== undefined && role !== target.role) {
    await recordAuditEvent({
      actorId: adminUser.id,
      action: "user.role_change",
      targetType: "user",
      targetId: userId,
      metadata: { previousRole: target.role, newRole },
      req,
    });
  }

  if (banned !== undefined && banned !== target.banned) {
    await recordAuditEvent({
      actorId: adminUser.id,
      action: banned ? "user.ban" : "user.unban",
      targetType: "user",
      targetId: userId,
      metadata: { reason: newBanReason },
      req,
    });
  }

  return {
    ...target,
    role: newRole,
    banned: newBanned,
    banReason: newBanReason,
    updatedAt: now.toISOString(),
  };
}

/**
 * Dispatch password reset for a staff user.
 */
export async function sendStaffPasswordReset({
  userId,
  adminUser,
  req,
}: {
  userId: string;
  adminUser: AuthenticatedUser;
  req?: Request;
}): Promise<{ success: boolean; resetUrl: string }> {
  const staff = await listStaffUsers();
  const target = staff.find((u) => u.id === userId);

  if (!target) {
    throw new Error(`Staff user not found.`);
  }

  const token = randomUUID();
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.BETTER_AUTH_URL ||
    "http://localhost:3000";
  const resetUrl = `${appUrl}/reset-password?token=${token}&email=${encodeURIComponent(target.email)}`;

  // Persist token for single-use password reset
  await createVerificationToken({
    token,
    email: target.email,
    type: "reset-password",
    expiresInMs: 60 * 60 * 1000, // 1 hour
  });

  await sendPasswordResetEmail({
    email: target.email,
    name: target.name,
    resetUrl,
  });

  await recordAuditEvent({
    actorId: adminUser.id,
    action: "user.password_reset_request",
    targetType: "user",
    targetId: userId,
    metadata: { email: target.email },
    req,
  });

  return { success: true, resetUrl };
}
