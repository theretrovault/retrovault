#!/bin/sh
# RetroVault Docker Entrypoint
# Runs database setup on first start, then starts the app.

set -e

DATA_DIR="/app/data"
DB_PATH="${DATA_DIR}/retrovault.db"

echo "[entrypoint] RetroVault starting..."

# ── Ensure data directory exists ──────────────────────────────────────────────
mkdir -p "${DATA_DIR}"

# ── Bootstrap app.config.json if missing ─────────────────────────────────────
if [ ! -f "${DATA_DIR}/app.config.json" ]; then
  echo "[entrypoint] No app.config.json found — copying sample config..."
  cp /app/data/sample/app.config.sample.json "${DATA_DIR}/app.config.json" 2>/dev/null || \
    echo '{"appName":"RetroVault","standaloneMode":true,"auth":{"enabled":false,"passwordHash":""},"features":{"business":true,"fieldTools":true,"social":true,"personal":true}}' > "${DATA_DIR}/app.config.json"
fi

# ── Run SQLite migrations ──────────────────────────────────────────────────────
# This is safe to run on every startup — Prisma migrate deploy is idempotent.
# It creates the DB if it doesn't exist, applies any pending migrations.
echo "[entrypoint] Applying database migrations..."
DATABASE_URL="file:${DB_PATH}" npx prisma migrate deploy 2>&1 || {
  echo "[entrypoint] WARNING: prisma migrate deploy failed — app may not work correctly"
}

echo "[entrypoint] Database ready at ${DB_PATH}"

# ── Start the app ─────────────────────────────────────────────────────────────
echo "[entrypoint] Starting RetroVault on port ${PORT:-3000}..."
exec "$@"
