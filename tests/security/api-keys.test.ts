import assert from "node:assert/strict";
import fs from "fs";
import path from "path";

console.log("=== RUNNING API KEY ISOLATION & CREDENTIAL LEAK SECURITY AUDIT ===\n");

const SRC_DIR = path.join(process.cwd(), "src");
const CLIENT_DIRS = [
  path.join(SRC_DIR, "app"),
  path.join(SRC_DIR, "components"),
  path.join(SRC_DIR, "templates"),
  path.join(SRC_DIR, "styles"),
];

const FORBIDDEN_SECRETS = [
  "ANTHROPIC_API_KEY",
  "OPENROUTER_API_KEY",
  "GEMINI_API_KEY",
  "GOOGLE_API_KEY",
  "UNSPLASH_ACCESS_KEY",
  "PEXELS_API_KEY",
  "AWS_SECRET_ACCESS_KEY",
  "AWS_ACCESS_KEY_ID",
  "DATABASE_URL",
];

const FORBIDDEN_KEY_PATTERNS = [
  /sk-ant-[a-zA-Z0-9_\-]{20,}/,    // Raw Anthropic key pattern
  /sk-or-v1-[a-zA-Z0-9_\-]{20,}/, // Raw OpenRouter key pattern
  /AIza[0-9A-Za-z-_]{35}/,        // Raw Google API key pattern
  /AKIA[0-9A-Z]{16}/,              // AWS Access Key ID
];

function scanDirectory(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDirectory(fullPath, fileList);
    } else if (/\.(tsx|ts|js|jsx|json)$/.test(entry.name)) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

// 1. Scan client components & pages for forbidden server secret references
console.log("[Test 1] Scanning client components and templates for private secrets...");
const allClientFiles: string[] = [];
for (const cDir of CLIENT_DIRS) {
  scanDirectory(cDir, allClientFiles);
}

// Exclude route.ts files (since app/api/**/route.ts are strictly server-side routes)
const strictlyClientFiles = allClientFiles.filter(
  (f) => !f.includes(`${path.sep}api${path.sep}`) && !path.basename(f).startsWith("route.")
);

let leakCount = 0;
for (const file of strictlyClientFiles) {
  const content = fs.readFileSync(file, "utf8");
  for (const secret of FORBIDDEN_SECRETS) {
    if (content.includes(secret)) {
      console.error(`[SECURITY LEAK] File ${file} references private secret: ${secret}`);
      leakCount++;
    }
  }
  for (const pattern of FORBIDDEN_KEY_PATTERNS) {
    if (pattern.test(content)) {
      console.error(`[SECURITY LEAK] File ${file} contains raw key matching pattern: ${pattern}`);
      leakCount++;
    }
  }
}

assert.equal(leakCount, 0, "No client component or template may reference private API keys");
console.log(`  -> Scanned ${strictlyClientFiles.length} client files: ZERO secrets exposed.`);

// 2. Scan entire codebase for NEXT_PUBLIC_ secret leaks
console.log("[Test 2] Auditing NEXT_PUBLIC_ environment variables...");
const allSrcFiles = scanDirectory(SRC_DIR);
let nextPublicLeakCount = 0;
for (const file of allSrcFiles) {
  const content = fs.readFileSync(file, "utf8");
  const matches = content.match(/NEXT_PUBLIC_[A-Z0-9_]+/g) || [];
  for (const m of matches) {
    const upper = m.toUpperCase();
    if (
      upper.includes("KEY") ||
      upper.includes("SECRET") ||
      upper.includes("TOKEN") ||
      upper.includes("AUTH") ||
      upper.includes("PASSWORD")
    ) {
      console.error(`[SECURITY LEAK] Insecure NEXT_PUBLIC_ secret name detected: ${m} in ${file}`);
      nextPublicLeakCount++;
    }
  }
}

assert.equal(nextPublicLeakCount, 0, "No NEXT_PUBLIC_ env var may expose keys or secrets");
console.log("  -> Zero sensitive NEXT_PUBLIC_ variables found in codebase.");

console.log("\nPASS: API KEY ISOLATION & CREDENTIAL SECURITY TESTS PASSED 100%!\n");
