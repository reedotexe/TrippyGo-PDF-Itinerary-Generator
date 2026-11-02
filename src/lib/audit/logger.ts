import fs from "fs";
import path from "path";
import { db, auditLogs } from "@/db";

export interface AuditEventInput {
  actorId?: string;
  action: string; // e.g. "itinerary.create", "itinerary.update", "itinerary.reassign", "itinerary.soft_delete", "itinerary.restore", "pdf.generate", "user.ban", "user.invite"
  targetType: string; // e.g. "itinerary" | "user" | "auth" | "system"
  targetId: string;
  metadata?: Record<string, unknown>;
  req?: Request;
}

const localDataDir = path.join(process.cwd(), ".data");
const localAuditFile = path.join(localDataDir, "audit_logs.json");

/**
 * Extract client IP address safely from standard proxy headers
 */
export function extractClientIp(req?: Request): string | undefined {
  if (!req) return undefined;
  try {
    const forwarded = req.headers.get("x-forwarded-for");
    if (forwarded) {
      const first = forwarded.split(",")[0].trim();
      if (first) return first;
    }
    const realIp = req.headers.get("x-real-ip");
    if (realIp) return realIp.trim();
  } catch {
    // ignore
  }
  return undefined;
}

/**
 * Record structured audit event into PostgreSQL audit_logs table
 * with resilient offline fallback to .data/audit_logs.json.
 * Fire-and-forget safe: never throws to crash the main request thread.
 */
export async function recordAuditEvent(event: AuditEventInput): Promise<void> {
  const ipAddress = extractClientIp(event.req);
  const now = new Date();

  // 1. Attempt PostgreSQL write
  try {
    await db.insert(auditLogs).values({
      actorId: event.actorId || null,
      action: event.action,
      targetType: event.targetType,
      targetId: event.targetId,
      metadata: event.metadata || {},
      ipAddress: ipAddress || null,
      createdAt: now,
    });
    return;
  } catch (err) {
    // Database offline or unreachable in local test environment
  }

  // 2. Resilient local fallback ledger
  try {
    if (!fs.existsSync(localDataDir)) {
      fs.mkdirSync(localDataDir, { recursive: true });
    }
    let localLogs: Array<Record<string, unknown>> = [];
    if (fs.existsSync(localAuditFile)) {
      try {
        localLogs = JSON.parse(fs.readFileSync(localAuditFile, "utf8"));
      } catch {
        localLogs = [];
      }
    }
    localLogs.push({
      id: "audit-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      actorId: event.actorId || null,
      action: event.action,
      targetType: event.targetType,
      targetId: event.targetId,
      metadata: event.metadata || {},
      ipAddress: ipAddress || null,
      createdAt: now.toISOString(),
    });
    // Keep max 500 local entries
    if (localLogs.length > 500) {
      localLogs = localLogs.slice(localLogs.length - 500);
    }
    fs.writeFileSync(localAuditFile, JSON.stringify(localLogs, null, 2), "utf8");
  } catch (fileErr) {
    console.error("[AuditLogger] Failed to write fallback audit event:", fileErr);
  }
}

export interface AuditLogItem {
  id: string;
  actorId?: string | null;
  action: string;
  targetType: string;
  targetId: string;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
  createdAt: string;
}

/**
 * Query audit ledger entries with DB fallback to local file ledger.
 */
export async function queryAuditLogs(options?: {
  action?: string;
  actorId?: string;
  targetType?: string;
  limit?: number;
}): Promise<AuditLogItem[]> {
  const limit = options?.limit || 100;

  // 1. Try PostgreSQL
  try {
    const { desc, eq, and } = await import("drizzle-orm");
    const conditions = [];
    if (options?.action) conditions.push(eq(auditLogs.action, options.action));
    if (options?.actorId) conditions.push(eq(auditLogs.actorId, options.actorId));
    if (options?.targetType) conditions.push(eq(auditLogs.targetType, options.targetType));

    const query = db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);

    const rows = conditions.length > 0 ? await query.where(and(...conditions)) : await query;

    return rows.map((r) => ({
      id: r.id,
      actorId: r.actorId,
      action: r.action,
      targetType: r.targetType,
      targetId: r.targetId,
      metadata: r.metadata,
      ipAddress: r.ipAddress,
      createdAt: r.createdAt.toISOString(),
    }));
  } catch (err) {
    // DB offline, fallback to local file
  }

  // 2. Fallback to local file store
  try {
    if (!fs.existsSync(localAuditFile)) {
      return [];
    }
    const raw = JSON.parse(fs.readFileSync(localAuditFile, "utf8"));
    let items: AuditLogItem[] = Array.isArray(raw) ? raw : [];

    if (options?.action) {
      items = items.filter((i) => i.action === options.action);
    }
    if (options?.actorId) {
      items = items.filter((i) => i.actorId === options.actorId);
    }
    if (options?.targetType) {
      items = items.filter((i) => i.targetType === options.targetType);
    }

    // Sort newest first
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return items.slice(0, limit);
  } catch (err) {
    console.error("[AuditLogger] Error reading local audit logs:", err);
    return [];
  }
}
