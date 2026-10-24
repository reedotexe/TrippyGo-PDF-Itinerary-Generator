import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { Itinerary } from "../schema/itinerary";
import { migrateItinerarySchema } from "../schema/migrate";
import { getPresignedDownloadUrl } from "../storage/s3";
import { db, itineraries, itineraryVersions } from "@/db";
import { eq, desc } from "drizzle-orm";

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
      updatedAt: string;
      createdAt: string;
    }
  >;
  versions: Record<string, Array<VersionSummary>>;
}

function getLocalStore(): LocalStore {
  if (!fs.existsSync(localDataDir)) {
    fs.mkdirSync(localDataDir, { recursive: true });
  }
  if (!fs.existsSync(localDataFile)) {
    fs.writeFileSync(localDataFile, JSON.stringify({ itineraries: {}, versions: {} }, null, 2), "utf8");
  }
  try {
    return JSON.parse(fs.readFileSync(localDataFile, "utf8"));
  } catch {
    return { itineraries: {}, versions: {} };
  }
}

function saveLocalStore(store: LocalStore) {
  if (!fs.existsSync(localDataDir)) {
    fs.mkdirSync(localDataDir, { recursive: true });
  }
  fs.writeFileSync(localDataFile, JSON.stringify(store, null, 2), "utf8");
}

/**
 * Fetch itinerary by ID with automatic schema migration
 */
export async function getItinerary(id: string): Promise<Itinerary | null> {
  // 1. Try DB
  try {
    const rows = await db.select().from(itineraries).where(eq(itineraries.id, id)).limit(1);
    if (rows.length > 0) {
      return migrateItinerarySchema(rows[0].currentData);
    }
  } catch (err) {
    // DB offline, fallback to local file store
  }

  // 2. Fallback to local store
  const store = getLocalStore();
  const entry = store.itineraries[id];
  return entry ? migrateItinerarySchema(entry.currentData) : null;
}

/**
 * Create or save itinerary
 */
export async function saveItineraryData(id: string, data: Itinerary): Promise<void> {
  const title = data.package.title || "Untitled Itinerary";
  const now = new Date();

  // 1. Try DB
  try {
    const existing = await db.select().from(itineraries).where(eq(itineraries.id, id)).limit(1);
    if (existing.length > 0) {
      await db
        .update(itineraries)
        .set({ title, currentData: data, updatedAt: now })
        .where(eq(itineraries.id, id));
      return;
    } else {
      await db.insert(itineraries).values({
        id,
        title,
        status: "draft",
        currentData: data,
        createdAt: now,
        updatedAt: now,
      });
      return;
    }
  } catch (err) {
    // DB offline, fallback to local store
  }

  // 2. Save in local store
  const store = getLocalStore();
  store.itineraries[id] = {
    id,
    title,
    status: "draft",
    currentData: data,
    updatedAt: now.toISOString(),
    createdAt: store.itineraries[id]?.createdAt || now.toISOString(),
  };
  saveLocalStore(store);
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
