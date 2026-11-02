import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

const localDataDir = path.join(process.cwd(), ".data");
const localSessionsFile = path.join(localDataDir, "sessions.json");
const localUsersFile = path.join(localDataDir, "users.json");

export interface DevSessionRecord {
  id: string;
  userId: string;
  role: "admin" | "salesperson";
  email: string;
  name: string;
  createdAt: string;
  expiresAt: string;
}

function getSessionStore(): Record<string, DevSessionRecord> {
  if (!fs.existsSync(localDataDir)) {
    fs.mkdirSync(localDataDir, { recursive: true });
  }
  if (!fs.existsSync(localSessionsFile)) {
    fs.writeFileSync(localSessionsFile, "{}", "utf8");
    return {};
  }
  try {
    return JSON.parse(fs.readFileSync(localSessionsFile, "utf8"));
  } catch {
    return {};
  }
}

function saveSessionStore(store: Record<string, DevSessionRecord>) {
  if (!fs.existsSync(localDataDir)) {
    fs.mkdirSync(localDataDir, { recursive: true });
  }
  fs.writeFileSync(localSessionsFile, JSON.stringify(store, null, 2), "utf8");
}

export function createDevSession(user: {
  id: string;
  name: string;
  email: string;
  role: "admin" | "salesperson";
}): DevSessionRecord {
  const store = getSessionStore();
  const token = `dev_sess_${randomUUID()}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const record: DevSessionRecord = {
    id: token,
    userId: user.id,
    role: user.role,
    email: user.email,
    name: user.name,
    createdAt: now.toISOString(),
    expiresAt,
  };

  store[token] = record;
  saveSessionStore(store);
  return record;
}

export function getDevSession(token: string): DevSessionRecord | null {
  if (!token) return null;
  const store = getSessionStore();
  const record = store[token];
  if (!record) return null;

  // Verify not expired
  if (new Date(record.expiresAt).getTime() < Date.now()) {
    delete store[token];
    saveSessionStore(store);
    return null;
  }

  // Check if user is banned in users.json
  if (fs.existsSync(localUsersFile)) {
    try {
      const usersData = JSON.parse(fs.readFileSync(localUsersFile, "utf8"));
      const u = usersData.users?.[record.userId];
      if (u) {
        if (u.banned) return null;
        record.role = u.role;
        record.name = u.name;
        record.email = u.email;
      }
    } catch {
      // ignore
    }
  }

  return record;
}

export function deleteDevSession(token: string): void {
  if (!token) return;
  const store = getSessionStore();
  delete store[token];
  saveSessionStore(store);
}
