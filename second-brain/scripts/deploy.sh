#!/bin/bash
# RetroVault Deploy Script
# Run this to build and restart the production server
# Usage: bash scripts/deploy.sh

set -e
APP_DIR="/home/apesch/.openclaw/workspace/second-brain"
cd "$APP_DIR"

echo "🕹️  RetroVault Deploy"
echo "━━━━━━━━━━━━━━━━━━━━"

# Pull latest changes
echo "📥 Pulling latest from GitHub..."
git pull origin master

# Install any new dependencies
echo "📦 Installing dependencies..."
npm install --frozen-lockfile 2>/dev/null || npm install

# Build production bundle
echo "🔨 Building production bundle..."
npm run build

# Restart pm2 (or start if not running)
echo "🔄 Restarting pm2 process..."
if pm2 describe retrovault > /dev/null 2>&1; then
    pm2 reload ecosystem.config.js --update-env
else
    pm2 start ecosystem.config.js
fi

echo ""
echo "✅ RetroVault deployed!"
echo "   Running at: http://127.0.0.1:3000"
echo "   nginx proxy: http://retrovault.local (or your configured hostname)"
echo ""
pm2 status retrovault
