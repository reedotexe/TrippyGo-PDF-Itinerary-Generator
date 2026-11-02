# =================================================================
# TrippyGo Playwright PDF Renderer Microservice
# Isolated headless Chromium environment with Brand Fonts
# =================================================================

FROM mcr.microsoft.com/playwright:v1.64.1-jammy

WORKDIR /app

# Install system utilities, fontconfig, and typography packages (Inter, DejaVu, Noto)
RUN apt-get update && apt-get install -y --no-install-recommends \
    fontconfig \
    fonts-inter \
    fonts-dejavu-core \
    fonts-noto-core \
    fonts-noto-color-emoji \
    curl \
    && fc-cache -f -v \
    && rm -rf /var/lib/apt/lists/*

# Install service dependencies
COPY package.json ./
RUN npm install --omit=dev

# Install tsx globally for fast direct execution without build step
RUN npm install -g tsx

# Copy renderer server source code and config
COPY server.ts ./
COPY tsconfig.json ./

EXPOSE 3001

ENV PORT=3001
ENV NODE_ENV=production

# Container Health Check
HEALTHCHECK --interval=10s --timeout=5s --retries=3 --start-period=5s \
  CMD curl -f http://localhost:3001/health || exit 1

CMD ["tsx", "server.ts"]
