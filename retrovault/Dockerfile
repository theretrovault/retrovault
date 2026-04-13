# RetroVault Dockerfile
# Multi-stage build: build the Next.js app, then serve it lean

# ─── Stage 1: Dependencies ────────────────────────────────────────────────────
FROM node:22-slim AS deps
WORKDIR /app

# Install dependencies first (cached layer unless package.json changes)
COPY package.json package-lock.json ./
RUN npm ci --frozen-lockfile

# ─── Stage 2: Builder ─────────────────────────────────────────────────────────
FROM node:22-slim AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Create minimal data directory for build (real data mounts at runtime)
RUN mkdir -p data && \
    echo '[]' > data/inventory.json && \
    echo '{"appName":"RetroVault","tagline":"Your Retro Gaming Collection Engine","ownerName":"","themeColor":"green","currency":"$","dateFormat":"US","region":"NTSC","publicUrl":"","standaloneMode":true,"auth":{"enabled":false,"passwordHash":""},"plex":{"url":"","token":""},"fetchScheduleHour":0,"priceDataSource":"pricecharting","githubRepo":"theretrovault/retrovault","scrapers":{"craigslistCity":"portland"},"features":{"business":true,"fieldTools":true,"social":true,"personal":true},"platforms":["NES","SNES","Nintendo 64","Gamecube","Nintendo Switch","Sega Genesis","Sega CD","Dreamcast","PS1","PS2","PS3","PSP","Xbox","Xbox 360"]}' > data/app.config.json && \
    echo '{"people":[],"favorites":{},"regrets":{}}' > data/favorites.json && \
    echo '{"sales":[],"acquisitions":[]}' > data/sales.json && \
    echo '[]' > data/watchlist.json && \
    echo '[]' > data/goals.json && \
    echo '[]' > data/grails.json && \
    echo '[]' > data/playlog.json && \
    echo '{}' > data/tags.json && \
    echo '[]' > data/events.json && \
    echo '{"sellers":[],"streams":[]}' > data/whatnot.json && \
    echo '[]' > data/value-history.json && \
    echo '[]' > data/achievements-unlocked.json && \
    echo '[]' > data/scrapers.json && \
    echo '[]' > data/bug-reports.json && \
    echo '{}' > data/youtube-cache.json

ENV DOCKER_BUILD=1
RUN npm run build

# ─── Stage 3: Runner ──────────────────────────────────────────────────────────
FROM node:22-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Install curl for healthcheck
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Scripts need Node available
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Data directory — will be overridden by volume mount
# Keeping a copy of defaults so the app can start without a volume
COPY --from=builder /app/data/sample ./data/sample

RUN mkdir -p data logs && \
    chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
