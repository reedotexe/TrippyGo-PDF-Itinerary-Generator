# =================================================================
# TrippyGo Web Application - Multi-stage Production Dockerfile
# =================================================================

# Stage 1: Dependencies Cache
FROM node:20-bookworm-slim AS deps
WORKDIR /app

# Install native dependencies required for build tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: Builder
FROM node:20-bookworm-slim AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set production build environment variables
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Compile Next.js standalone application
RUN npm run build

# Stage 3: Minimal Production Runner
FROM node:20-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Install curl for health checking
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Security: Create non-root user and group (UID/GID 1001)
RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid 1001 nextjs

# Copy early-boot V8 polyfills
COPY polyfill.cjs ./polyfill.cjs

# Copy static assets and standalone server output
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Ensure persistent local fallback storage directories exist with non-root ownership
RUN mkdir -p /app/.data /app/.uploads && chown -R nextjs:nodejs /app/.data /app/.uploads

# Preload polyfills into all Node runtimes
ENV NODE_OPTIONS="--require /app/polyfill.cjs"

# Drop privileges to non-root user
USER nextjs

EXPOSE 3000

# Container Health Check
HEALTHCHECK --interval=15s --timeout=5s --retries=3 --start-period=10s \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["node", "-r", "./polyfill.cjs", "server.js"]
