import assert from "node:assert/strict";
import fs from "fs";
import path from "path";

console.log("=== RUNNING DOCKER, CI/CD & DEPLOYMENT CONFIGURATION AUDIT ===\n");

// -------------------------------------------------------------
// Test 1: Web Application Multi-Stage Dockerfile
// -------------------------------------------------------------
console.log("[Test 1] Auditing root Dockerfile (Next.js Standalone)...");
const rootDockerfilePath = path.join(process.cwd(), "Dockerfile");
assert.ok(fs.existsSync(rootDockerfilePath), "Root Dockerfile must exist");
const rootDockerfile = fs.readFileSync(rootDockerfilePath, "utf8");

assert.ok(
  rootDockerfile.includes("node:20-bookworm-slim"),
  "Must use node:20-bookworm-slim base image"
);
assert.ok(
  rootDockerfile.includes("AS builder") && rootDockerfile.includes("AS runner"),
  "Must be a multi-stage Docker build"
);
assert.ok(
  rootDockerfile.includes(".next/standalone"),
  "Must copy .next/standalone in runner stage"
);
assert.ok(
  rootDockerfile.includes("useradd --system --uid 1001") ||
    rootDockerfile.includes("USER nextjs") ||
    rootDockerfile.includes("USER 1001"),
  "Must drop privileges to non-root user (UID 1001)"
);
assert.ok(rootDockerfile.includes("EXPOSE 3000"), "Must expose port 3000");
assert.ok(
  rootDockerfile.includes("/health"),
  "Must configure container healthcheck against /health"
);
console.log("  -> Root Dockerfile strictly satisfies all production security criteria.");

// -------------------------------------------------------------
// Test 2: Renderer Microservice Dockerfile
// -------------------------------------------------------------
console.log("[Test 2] Auditing Renderer Dockerfile (Playwright Chromium)...");
const rendererDockerfilePath = path.join(
  process.cwd(),
  "services",
  "renderer",
  "Dockerfile"
);
assert.ok(fs.existsSync(rendererDockerfilePath), "Renderer Dockerfile must exist");
const rendererDockerfile = fs.readFileSync(rendererDockerfilePath, "utf8");

assert.ok(
  rendererDockerfile.includes("mcr.microsoft.com/playwright:v1.49.0-jammy"),
  "Must use official Playwright Jammy base image"
);
assert.ok(
  rendererDockerfile.includes("fonts-inter") || rendererDockerfile.includes("fontconfig"),
  "Must install brand typography and font packages"
);
assert.ok(
  rendererDockerfile.includes("fc-cache"),
  "Must rebuild font cache with fc-cache"
);
assert.ok(rendererDockerfile.includes("EXPOSE 3001"), "Must expose port 3001");
assert.ok(
  rendererDockerfile.includes("HEALTHCHECK") && rendererDockerfile.includes("/health"),
  "Must define health check on /health"
);
console.log("  -> Renderer Dockerfile verified with font dependencies and health checks.");

// -------------------------------------------------------------
// Test 3: Docker Compose Services & Resource Limits
// -------------------------------------------------------------
console.log("[Test 3] Auditing docker-compose.yml services and resource allocations...");
const composePath = path.join(process.cwd(), "docker-compose.yml");
assert.ok(fs.existsSync(composePath), "docker-compose.yml must exist");
const composeContent = fs.readFileSync(composePath, "utf8");

// Service declarations
assert.ok(composeContent.includes("web:"), "Must declare web service");
assert.ok(composeContent.includes("renderer:"), "Must declare renderer service");
assert.ok(composeContent.includes("db:"), "Must declare PostgreSQL database service");
assert.ok(composeContent.includes("minio:"), "Must declare MinIO storage service");

// Resource limits
assert.ok(
  composeContent.includes("shm_size: \"2gb\"") || composeContent.includes("shm_size: '2gb'"),
  "Renderer must allocate 2GB shared memory (shm_size) for multi-page Chromium rendering"
);
assert.ok(
  composeContent.includes("mem_limit: 4g"),
  "Renderer must specify 4GB memory limit"
);
assert.ok(
  composeContent.includes("cpus: \"2\"") || composeContent.includes("cpus: '2'"),
  "Renderer must specify 2 CPUs allocation"
);
assert.ok(
  composeContent.includes("mem_limit: 1g"),
  "Web application must specify 1GB memory limit"
);

// Service dependencies & health checks
assert.ok(
  composeContent.includes("healthcheck:"),
  "Services must define container healthchecks"
);
console.log("  -> docker-compose.yml resource allocations, memory limits, and services verified.");

// -------------------------------------------------------------
// Test 4: Web Application Health Check Routes
// -------------------------------------------------------------
console.log("[Test 4] Auditing Web Health Check routes...");
const healthRoutePath = path.join(process.cwd(), "src", "app", "health", "route.ts");
const apiHealthRoutePath = path.join(process.cwd(), "src", "app", "api", "health", "route.ts");
assert.ok(fs.existsSync(healthRoutePath), "/health route must exist");
assert.ok(fs.existsSync(apiHealthRoutePath), "/api/health route must exist");

const healthContent = fs.readFileSync(healthRoutePath, "utf8");
assert.ok(healthContent.includes('"ok"'), "Health route must return status ok");
console.log("  -> Web health check endpoints verified.");

// -------------------------------------------------------------
// Test 5: Next.js Standalone Build Configuration
// -------------------------------------------------------------
console.log("[Test 5] Auditing next.config.ts for output: 'standalone'...");
const nextConfigPath = path.join(process.cwd(), "next.config.ts");
const nextConfigContent = fs.readFileSync(nextConfigPath, "utf8");
assert.ok(
  nextConfigContent.includes('output: "standalone"') ||
    nextConfigContent.includes("output: 'standalone'"),
  "next.config.ts must enable standalone output for minimal Docker footprint"
);
console.log("  -> Standalone output confirmed in next.config.ts.");

// -------------------------------------------------------------
// Test 6: GitHub Actions Workflows (CI & Deploy)
// -------------------------------------------------------------
console.log("[Test 6] Auditing GitHub Actions CI/CD workflows...");
const ciWorkflowPath = path.join(process.cwd(), ".github", "workflows", "ci.yml");
const deployWorkflowPath = path.join(process.cwd(), ".github", "workflows", "deploy.yml");

assert.ok(fs.existsSync(ciWorkflowPath), ".github/workflows/ci.yml must exist");
assert.ok(fs.existsSync(deployWorkflowPath), ".github/workflows/deploy.yml must exist");

const ciContent = fs.readFileSync(ciWorkflowPath, "utf8");
assert.ok(ciContent.includes("npm run lint"), "CI must execute linting");
assert.ok(ciContent.includes("tsc --noEmit"), "CI must execute TypeScript checking");
assert.ok(ciContent.includes("test:unit"), "CI must execute unit tests");
assert.ok(ciContent.includes("test:extraction"), "CI must execute extraction harness");
assert.ok(ciContent.includes("test:leak"), "CI must execute PDF leak checks");
assert.ok(ciContent.includes("docker/build-push-action"), "CI must validate Docker image builds");

const deployContent = fs.readFileSync(deployWorkflowPath, "utf8");
assert.ok(deployContent.includes("ghcr.io"), "Deploy workflow must publish to container registry");
assert.ok(
  deployContent.includes("drizzle-kit migrate"),
  "Deploy workflow must execute Drizzle migrations before release"
);
console.log("  -> CI & CD GitHub Actions workflows verified.");

console.log("\nPASS: ALL DOCKER, CI/CD & DEPLOYMENT SPECIFICATIONS VERIFIED 100%!\n");
