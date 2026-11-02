import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { Itinerary } from "../schema/itinerary";
import { migrateItinerarySchema } from "../schema/migrate";
import { getPresignedDownloadUrl } from "../storage/s3";
import { computeSellingPricePaise, formatInr } from "../pricing";
import { db, itineraries, itineraryVersions } from "@/db";
import { eq, desc, and, isNull, isNotNull } from "drizzle-orm";
import { recordAuditEvent } from "@/lib/audit/logger";
import { AuthenticatedUser } from "@/lib/auth/guard";

const localDataDir = path.join(process.cwd(), ".data");
const localDataFile = path.join(localDataDir, "itineraries.json");

export interface VersionSummary {
  id: string;
  itineraryId: string;
  versionNumber: number;
  data: Itinerary;
  changedAt: string;
  pdfS3Key?: string;
  pdfJsonHash?: string;
  downloadUrl?: string;
}

interface LocalStore {
  itineraries: Record<
    string,
    {
      id: string;
      title: string;
      status: string;
      currentData: Itinerary;
      ownerId?: string | null;
      createdBy?: string | null;
      updatedBy?: string | null;
      deletedAt?: string | null;
      deletedBy?: string | null;
      updatedAt: string;
      createdAt: string;
    }
  >;
  versions: Record<string, Array<VersionSummary>>;
}

let storeCache: { mtimeMs: number; store: LocalStore } | null = null;

function getLocalStore(): LocalStore {
  if (!fs.existsSync(localDataDir)) {
    fs.mkdirSync(localDataDir, { recursive: true });
  }
  if (!fs.existsSync(localDataFile)) {
    const initial: LocalStore = { itineraries: {}, versions: {} };
    saveLocalStore(initial);
    return initial;
  }

  try {
    const stat = fs.statSync(localDataFile);
    if (storeCache && storeCache.mtimeMs === stat.mtimeMs) {
      return storeCache.store;
    }

    let raw = "";
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        raw = fs.readFileSync(localDataFile, "utf8");
        if (raw.trim().length > 0) break;
      } catch (err: any) {
        if (attempt < 4 && (err.code === "EBUSY" || err.code === "EPERM")) {
          const start = Date.now();
          while (Date.now() - start < 15) {}
          continue;
        }
        throw err;
      }
    }

    if (!raw.trim()) {
      if (storeCache) return storeCache.store;
      return { itineraries: {}, versions: {} };
    }

    const parsed = JSON.parse(raw);
    const store: LocalStore = {
      itineraries: parsed.itineraries || {},
      versions: parsed.versions || {},
    };
    storeCache = { mtimeMs: stat.mtimeMs, store };
    return store;
  } catch (err) {
    if (storeCache) {
      return storeCache.store;
    }
    return { itineraries: {}, versions: {} };
  }
}

function saveLocalStore(store: LocalStore) {
  if (!fs.existsSync(localDataDir)) {
    fs.mkdirSync(localDataDir, { recursive: true });
  }
  const content = JSON.stringify(store, null, 2);
  const tmpFile = path.join(localDataDir, `itineraries.${process.pid}.${Date.now()}.tmp`);

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      fs.writeFileSync(tmpFile, content, "utf8");
      try {
        fs.renameSync(tmpFile, localDataFile);
      } catch {
        fs.copyFileSync(tmpFile, localDataFile);
        try { fs.unlinkSync(tmpFile); } catch {}
      }

      const stat = fs.statSync(localDataFile);
      storeCache = { mtimeMs: stat.mtimeMs, store };
      return;
    } catch (err: any) {
      try { if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile); } catch {}
      if (attempt < 4) {
        const start = Date.now();
        while (Date.now() - start < 20) {}
        continue;
      }
      fs.writeFileSync(localDataFile, content, "utf8");
      try {
        const stat = fs.statSync(localDataFile);
        storeCache = { mtimeMs: stat.mtimeMs, store };
      } catch {}
    }
  }
}

/**
 * Fetch itinerary by ID with automatic schema migration and strict ownership filtering.
 *
 * Rules:
 * - Admin: Access any non-deleted proposal.
 * - Salesperson: Access ONLY their own proposals (where owner_id = user.id). Returns null if unowned (404 anti-probing).
 * - Internal (undefined user, e.g. token-verified print render): Fetch non-deleted proposal by ID.
 * - Unauthenticated (null user): Returns null.
 */
export async function getItinerary(
  id: string,
  user?: AuthenticatedUser | null
): Promise<Itinerary | null> {
  if (user === null) {
    return null; // Explicitly unauthenticated -> not found
  }

  // 1. Try DB
  try {
    const conditions = [eq(itineraries.id, id), isNull(itineraries.deletedAt)];
    if (user?.role === "salesperson") {
      conditions.push(eq(itineraries.ownerId, user.id));
    }

    const rows = await db
      .select()
      .from(itineraries)
      .where(and(...conditions))
      .limit(1);

    if (rows.length > 0) {
      return migrateItinerarySchema(rows[0].currentData);
    }

    // If query returned no rows and we had a valid DB connection, record is either missing or unowned
    // (Notice: we don't fall back to local store if DB is actively working and returned empty)
  } catch (err) {
    // DB offline, fallback to local file store
  }

  // 2. Fallback to local store
  const store = getLocalStore();
  const entry = store.itineraries[id];
  if (!entry) return null;

  // Soft-deleted records are hidden from standard operations
  if (entry.deletedAt) return null;

  // Salesperson ownership enforcement (anti-probing)
  if (user?.role === "salesperson" && entry.ownerId && entry.ownerId !== user.id) {
    return null;
  }

  return migrateItinerarySchema(entry.currentData);
}

/**
 * Create or save an itinerary with automatic ownership stamps and audit logging.
 */
export async function saveItineraryData(
  id: string,
  data: Itinerary,
  user?: AuthenticatedUser | null
): Promise<void> {
  const title = data.package.title || "Untitled Itinerary";
  const now = new Date();
  const actorId = user?.id || null;
  const ownerId = user?.id || data.ownership?.ownerId || null;

  // 1. Try DB
  try {
    const existing = await db
      .select()
      .from(itineraries)
      .where(eq(itineraries.id, id))
      .limit(1);

    if (existing.length > 0) {
      const row = existing[0];
      // Anti-probing: reject update if soft-deleted or unowned by this salesperson
      if (row.deletedAt) {
        const error = new Error("Itinerary not found");
        (error as any).status = 404;
        throw error;
      }
      if (user?.role === "salesperson" && row.ownerId && row.ownerId !== user.id) {
        const error = new Error("Itinerary not found");
        (error as any).status = 404;
        throw error;
      }

      await db
        .update(itineraries)
        .set({
          title,
          currentData: data,
          updatedBy: actorId,
          updatedAt: now,
        })
        .where(eq(itineraries.id, id));

      await recordAuditEvent({
        actorId: actorId || undefined,
        action: "itinerary.update",
        targetType: "itinerary",
        targetId: id,
        metadata: { title },
      });
      return;
    } else {
      await db.insert(itineraries).values({
        id,
        title,
        status: "draft",
        currentData: data,
        ownerId,
        createdBy: actorId,
        updatedBy: actorId,
        createdAt: now,
        updatedAt: now,
      });

      await recordAuditEvent({
        actorId: actorId || undefined,
        action: "itinerary.create",
        targetType: "itinerary",
        targetId: id,
        metadata: { title, ownerId },
      });
      return;
    }
  } catch (err: any) {
    if (err?.status === 404) throw err;
    // DB offline, fallback to local store
  }

  // 2. Save in local store
  const store = getLocalStore();
  const existingEntry = store.itineraries[id];

  if (existingEntry) {
    if (existingEntry.deletedAt) {
      const error = new Error("Itinerary not found");
      (error as any).status = 404;
      throw error;
    }
    if (user?.role === "salesperson" && existingEntry.ownerId && existingEntry.ownerId !== user.id) {
      const error = new Error("Itinerary not found");
      (error as any).status = 404;
      throw error;
    }

    store.itineraries[id] = {
      ...existingEntry,
      title,
      currentData: data,
      updatedBy: actorId,
      updatedAt: now.toISOString(),
    };
    saveLocalStore(store);

    await recordAuditEvent({
      actorId: actorId || undefined,
      action: "itinerary.update",
      targetType: "itinerary",
      targetId: id,
      metadata: { title },
    });
  } else {
    store.itineraries[id] = {
      id,
      title,
      status: "draft",
      currentData: data,
      ownerId,
      createdBy: actorId,
      updatedBy: actorId,
      updatedAt: now.toISOString(),
      createdAt: now.toISOString(),
    };
    saveLocalStore(store);

    await recordAuditEvent({
      actorId: actorId || undefined,
      action: "itinerary.create",
      targetType: "itinerary",
      targetId: id,
      metadata: { title, ownerId },
    });
  }
}

/**
 * Explicit helper to create an itinerary owned by the authenticated user.
 */
export async function createItinerary(
  id: string,
  data: Itinerary,
  user: AuthenticatedUser
): Promise<void> {
  return saveItineraryData(id, data, user);
}

/**
 * Soft delete an itinerary (hides record from salesperson views, accessible in admin trash).
 * Enforces ownership: only an admin or the designated owner can delete.
 *
 * @returns {Promise<boolean>} true if deleted, false if not found / unowned (404 anti-probing).
 */
export async function softDeleteItinerary(
  id: string,
  user: AuthenticatedUser
): Promise<boolean> {
  const now = new Date();

  // 1. Try DB
  try {
    const existing = await db.select().from(itineraries).where(eq(itineraries.id, id)).limit(1);
    if (existing.length > 0) {
      const row = existing[0];
      if (row.deletedAt) return false;
      if (user.role === "salesperson" && row.ownerId && row.ownerId !== user.id) {
        return false; // Anti-probing: return false (translates to 404)
      }

      await db
        .update(itineraries)
        .set({ deletedAt: now, deletedBy: user.id })
        .where(eq(itineraries.id, id));

      await recordAuditEvent({
        actorId: user.id,
        action: "itinerary.soft_delete",
        targetType: "itinerary",
        targetId: id,
        metadata: { title: row.title, ownerId: row.ownerId },
      });
      return true;
    }
  } catch (err) {
    // DB offline, fall through to local store
  }

  // 2. Local store
  const store = getLocalStore();
  const entry = store.itineraries[id];
  if (entry) {
    if (entry.deletedAt) return false;
    if (user.role === "salesperson" && entry.ownerId && entry.ownerId !== user.id) {
      return false;
    }

    entry.deletedAt = now.toISOString();
    entry.deletedBy = user.id;
    saveLocalStore(store);

    await recordAuditEvent({
      actorId: user.id,
      action: "itinerary.soft_delete",
      targetType: "itinerary",
      targetId: id,
      metadata: { title: entry.title, ownerId: entry.ownerId },
    });
    return true;
  }

  return false;
}

/**
 * Restore a soft-deleted proposal (Administrator privilege required).
 */
export async function restoreItinerary(
  id: string,
  adminUser: AuthenticatedUser
): Promise<boolean> {
  if (adminUser.role !== "admin") return false;
  const now = new Date();

  // 1. Try DB
  try {
    const existing = await db.select().from(itineraries).where(eq(itineraries.id, id)).limit(1);
    if (existing.length > 0) {
      await db
        .update(itineraries)
        .set({ deletedAt: null, deletedBy: null, updatedBy: adminUser.id, updatedAt: now })
        .where(eq(itineraries.id, id));

      await recordAuditEvent({
        actorId: adminUser.id,
        action: "itinerary.restore",
        targetType: "itinerary",
        targetId: id,
        metadata: { title: existing[0].title },
      });
      return true;
    }
  } catch (err) {
    // DB offline
  }

  // 2. Local store
  const store = getLocalStore();
  const entry = store.itineraries[id];
  if (entry) {
    delete entry.deletedAt;
    delete entry.deletedBy;
    entry.updatedAt = now.toISOString();
    saveLocalStore(store);

    await recordAuditEvent({
      actorId: adminUser.id,
      action: "itinerary.restore",
      targetType: "itinerary",
      targetId: id,
      metadata: { title: entry.title },
    });
    return true;
  }

  return false;
}

/**
 * Reassign proposal ownership to another salesperson (Administrator privilege required).
 */
export async function reassignItinerary(
  id: string,
  newOwnerId: string,
  adminUser: AuthenticatedUser
): Promise<boolean> {
  if (adminUser.role !== "admin") return false;
  const now = new Date();

  // 1. Try DB
  try {
    const existing = await db.select().from(itineraries).where(eq(itineraries.id, id)).limit(1);
    if (existing.length > 0) {
      const prevOwner = existing[0].ownerId;
      await db
        .update(itineraries)
        .set({ ownerId: newOwnerId, updatedBy: adminUser.id, updatedAt: now })
        .where(eq(itineraries.id, id));

      await recordAuditEvent({
        actorId: adminUser.id,
        action: "itinerary.reassign",
        targetType: "itinerary",
        targetId: id,
        metadata: { previousOwnerId: prevOwner, newOwnerId },
      });
      return true;
    }
  } catch (err) {
    // DB offline
  }

  // 2. Local store
  const store = getLocalStore();
  const entry = store.itineraries[id];
  if (entry) {
    const prevOwner = entry.ownerId;
    entry.ownerId = newOwnerId;
    entry.updatedAt = now.toISOString();
    saveLocalStore(store);

    await recordAuditEvent({
      actorId: adminUser.id,
      action: "itinerary.reassign",
      targetType: "itinerary",
      targetId: id,
      metadata: { previousOwnerId: prevOwner, newOwnerId },
    });
    return true;
  }

  return false;
}

/**
 * Create a new immutable version when PDF is generated
 */
export async function createItineraryVersion(
  itineraryId: string,
  data: Itinerary,
  pdfS3Key?: string,
  pdfJsonHash?: string
): Promise<{ versionNumber: number; versionId: string }> {
  const versionId = randomUUID();
  const now = new Date();

  // Try DB
  try {
    const versions = await db
      .select({ versionNumber: itineraryVersions.versionNumber })
      .from(itineraryVersions)
      .where(eq(itineraryVersions.itineraryId, itineraryId))
      .orderBy(desc(itineraryVersions.versionNumber))
      .limit(1);

    const nextVersionNumber = (versions[0]?.versionNumber || 0) + 1;

    await db.insert(itineraryVersions).values({
      id: versionId,
      itineraryId,
      versionNumber: nextVersionNumber,
      data,
      pdfS3Key,
      pdfJsonHash,
      changedAt: now,
    });

    return { versionNumber: nextVersionNumber, versionId };
  } catch (err) {
    // Fallback to local store
  }

  const store = getLocalStore();
  const list = store.versions[itineraryId] || [];
  const nextVersionNumber = list.length + 1;
  list.push({
    id: versionId,
    itineraryId,
    versionNumber: nextVersionNumber,
    data,
    pdfS3Key,
    pdfJsonHash,
    changedAt: now.toISOString(),
  });
  store.versions[itineraryId] = list;
  saveLocalStore(store);

  return { versionNumber: nextVersionNumber, versionId };
}

/**
 * Fetch all historical versions for an itinerary
 */
export async function getItineraryVersions(itineraryId: string): Promise<VersionSummary[]> {
  let list: VersionSummary[] = [];

  try {
    const rows = await db
      .select()
      .from(itineraryVersions)
      .where(eq(itineraryVersions.itineraryId, itineraryId))
      .orderBy(desc(itineraryVersions.versionNumber));

    if (rows.length > 0) {
      list = rows.map((r) => ({
        id: r.id,
        itineraryId: r.itineraryId,
        versionNumber: r.versionNumber,
        data: r.data,
        changedAt: r.changedAt.toISOString(),
        pdfS3Key: r.pdfS3Key || undefined,
        pdfJsonHash: r.pdfJsonHash || undefined,
      }));
    }
  } catch (err) {
    // Fallback to local store
    const store = getLocalStore();
    list = store.versions[itineraryId] || [];
  }

  // Populate download URLs for each version
  const withUrls = await Promise.all(
    list.map(async (v) => {
      let downloadUrl = `/print/${itineraryId}?version=${v.versionNumber}&preview=1`;
      if (v.pdfS3Key) {
        downloadUrl = await getPresignedDownloadUrl(v.pdfS3Key);
      }
      return {
        ...v,
        downloadUrl,
      };
    })
  );

  return withUrls.sort((a, b) => b.versionNumber - a.versionNumber);
}

/**
 * Restore an itinerary to a previous version snapshot
 */
export async function restoreItineraryVersion(
  itineraryId: string,
  versionNumber: number
): Promise<Itinerary | null> {
  const versions = await getItineraryVersions(itineraryId);
  const target = versions.find((v) => v.versionNumber === versionNumber);

  if (!target) {
    return null;
  }

  const restoredData = migrateItinerarySchema(target.data);
  await saveItineraryData(itineraryId, restoredData);
  return restoredData;
}

export interface ItinerarySummary {
  id: string;
  title: string;
  status: "draft" | "generated" | "archived";
  guestName?: string;
  destinations: string[];
  daysCount: number;
  nightsCount: number;
  startDate?: string;
  sellingPricePaise: number;
  sellingPriceFormatted: string;
  updatedAt: string;
  createdAt: string;
  hasPdf: boolean;
  lastPdfUrl?: string | null;
  versionCount: number;
  ownerId?: string | null;
  createdBy?: string | null;
  deletedAt?: string | null;
}

function toSummary(
  id: string,
  rawTitle: string,
  rawStatus: string,
  currentData: Itinerary,
  createdAt: string | Date,
  updatedAt: string | Date,
  versions: VersionSummary[] = [],
  ownerId?: string | null,
  createdBy?: string | null,
  deletedAt?: string | null
): ItinerarySummary {
  let data: any = currentData;
  try {
    data = migrateItinerarySchema(currentData);
  } catch {
    // If strict schema validation fails on incomplete drafts, use currentData directly
    data = currentData || {};
  }

  const pkg = data.package || {};
  const destinations = Array.isArray(pkg.destinations) ? pkg.destinations : [];
  const daysCount = Array.isArray(data.days) ? data.days.length : (pkg.days || 1);
  const nightsCount = pkg.nights || Math.max(0, daysCount - 1);

  let sellingPricePaise = 0;
  if (data.pricing?.netAmountPaise) {
    sellingPricePaise = data.pricing.netAmountPaise;
  } else if (data.pricing?.totalPackagePricePaise) {
    sellingPricePaise = data.pricing.totalPackagePricePaise;
  }
  const sellingPriceFormatted = sellingPricePaise > 0 ? formatInr(sellingPricePaise) : "₹0";

  const hasPdf = versions.some((v) => !!v.pdfS3Key) || versions.length > 0;
  const status: "draft" | "generated" | "archived" = hasPdf ? "generated" : "draft";

  return {
    id,
    title: pkg.title || rawTitle || "Untitled Itinerary",
    status,
    guestName: pkg.guestName?.trim() || undefined,
    destinations,
    daysCount,
    nightsCount,
    startDate: pkg.startDate || undefined,
    sellingPricePaise,
    sellingPriceFormatted,
    updatedAt: typeof updatedAt === "string" ? updatedAt : updatedAt.toISOString(),
    createdAt: typeof createdAt === "string" ? createdAt : createdAt.toISOString(),
    hasPdf,
    lastPdfUrl: hasPdf ? `/api/itineraries/${id}/pdf` : null,
    versionCount: versions.length,
    ownerId: ownerId || null,
    createdBy: createdBy || null,
    deletedAt: deletedAt || null,
  };
}

function filterSummaries(
  items: ItinerarySummary[],
  query?: { search?: string; status?: string }
): ItinerarySummary[] {
  let result = items;
  if (query?.search && query.search.trim()) {
    const term = query.search.toLowerCase().trim();
    result = result.filter(
      (item) =>
        item.title.toLowerCase().includes(term) ||
        (item.guestName && item.guestName.toLowerCase().includes(term)) ||
        item.destinations.some((d) => d.toLowerCase().includes(term))
    );
  }
  if (query?.status && query.status !== "all") {
    result = result.filter((item) => item.status === query.status);
  }
  return result;
}

/**
 * List itineraries scoped by role:
 * - Admin: Sees all proposals across agency (optionally filtered by ownerFilter).
 * - Salesperson: Strictly sees proposals where owner_id = user.id.
 */
export async function listItineraries(
  user?: AuthenticatedUser | null,
  query?: {
    search?: string;
    status?: string;
    ownerFilter?: string;
    includeDeleted?: boolean;
    deletedOnly?: boolean;
  }
): Promise<ItinerarySummary[]> {
  if (user === null) {
    return [];
  }

  const summaries: ItinerarySummary[] = [];

  // 1. Try DB
  try {
    const conditions = [];
    if (query?.deletedOnly) {
      conditions.push(isNotNull(itineraries.deletedAt));
    } else if (!query?.includeDeleted) {
      conditions.push(isNull(itineraries.deletedAt));
    }
    if (user?.role === "salesperson") {
      conditions.push(eq(itineraries.ownerId, user.id));
    } else if (user?.role === "admin" && query?.ownerFilter) {
      conditions.push(eq(itineraries.ownerId, query.ownerFilter));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const rows = await db
      .select()
      .from(itineraries)
      .where(whereClause)
      .orderBy(desc(itineraries.updatedAt));

    if (rows && rows.length > 0) {
      for (const row of rows) {
        let versions: VersionSummary[] = [];
        try {
          const vRows = await db
            .select()
            .from(itineraryVersions)
            .where(eq(itineraryVersions.itineraryId, row.id))
            .orderBy(desc(itineraryVersions.versionNumber));
          versions = vRows.map((r) => ({
            id: r.id,
            itineraryId: r.itineraryId,
            versionNumber: r.versionNumber,
            data: r.data,
            changedAt: r.changedAt.toISOString(),
            pdfS3Key: r.pdfS3Key || undefined,
          }));
        } catch {}

        summaries.push(
          toSummary(
            row.id,
            row.title,
            row.status,
            row.currentData,
            row.createdAt,
            row.updatedAt,
            versions,
            row.ownerId,
            row.createdBy,
            row.deletedAt ? row.deletedAt.toISOString() : null
          )
        );
      }
      return filterSummaries(summaries, query);
    }
  } catch (err) {
    // DB offline, fallback to local store
  }

  // 2. Local store fallback
  const store = getLocalStore();
  let entries = Object.values(store.itineraries || {});

  // Exclude soft-deleted records unless explicitly requested
  if (query?.deletedOnly) {
    entries = entries.filter((e) => !!e.deletedAt);
  } else if (!query?.includeDeleted) {
    entries = entries.filter((e) => !e.deletedAt);
  }

  // Role scoping: salesperson only sees their own
  if (user?.role === "salesperson") {
    entries = entries.filter((e) => e.ownerId === user.id);
  } else if (user?.role === "admin" && query?.ownerFilter) {
    entries = entries.filter((e) => e.ownerId === query.ownerFilter);
  }

  for (const entry of entries) {
    const versions = store.versions[entry.id] || [];
    summaries.push(
      toSummary(
        entry.id,
        entry.title,
        entry.status,
        entry.currentData,
        entry.createdAt || entry.updatedAt,
        entry.updatedAt,
        versions,
        entry.ownerId,
        entry.createdBy,
        entry.deletedAt || null
      )
    );
  }

  summaries.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  return filterSummaries(summaries, query);
}

/**
 * Hard delete an itinerary and its historical versions (internal/cleanup only)
 */
export async function deleteItinerary(id: string): Promise<boolean> {
  // 1. Try DB
  try {
    await db.delete(itineraryVersions).where(eq(itineraryVersions.itineraryId, id));
    await db.delete(itineraries).where(eq(itineraries.id, id));
  } catch (err) {
    // DB offline or error
  }

  // 2. Local store
  const store = getLocalStore();
  if (store.itineraries && store.itineraries[id]) {
    delete store.itineraries[id];
    if (store.versions) {
      delete store.versions[id];
    }
    saveLocalStore(store);
  }
  return true;
}
