import { NextResponse } from 'next/server';
import fs from 'fs';
import { getDatabasePath, resolveDataPath } from '@/lib/runtimeDataPaths';
import { resolveLogPath } from '@/lib/runtimePaths';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type HealthInventoryItem = { copies?: unknown[]; marketLoose?: string | number | null; lastFetched?: string | null };
type ScraperStatus = { id?: string; name?: string; enabled?: boolean; status?: string; lastRun?: string | null; lastRunStatus?: string | null };

function fileSize(filePath: string): number {
  try { return fs.statSync(filePath).size; } catch { return 0; }
}

function readLastLine(logFile: string): string {
  try {
    const p = resolveLogPath(logFile);
    if (!fs.existsSync(p)) return 'No log yet';
    const content = fs.readFileSync(p, 'utf8');
    const lines = content.trim().split('\n').filter(Boolean);
    return lines[lines.length - 1] || 'Empty';
  } catch { return 'Error reading log'; }
}

function getScraperStatus() {
  try {
    const scrapersPath = resolveDataPath('scrapers.json');
    if (!fs.existsSync(scrapersPath)) return [];
    return JSON.parse(fs.readFileSync(scrapersPath, 'utf8'));
  } catch { return []; }
}

export function calculateInventoryStats(inv: HealthInventoryItem[]) {
  const owned = inv.filter((i) => (i.copies || []).length > 0).length;
  const withPrices = inv.filter((i) => i.marketLoose && parseFloat(String(i.marketLoose)) > 0).length;
  const stale30 = inv.filter((i) => {
    if (!i.lastFetched) return (i.copies || []).length > 0;
    const days = (Date.now() - new Date(i.lastFetched).getTime()) / 86400000;
    return days > 30 && (i.copies || []).length > 0;
  }).length;
  const neverFetched = inv.filter((i) => !i.lastFetched && (i.copies || []).length > 0).length;
  return { total: inv.length, owned, withPrices, stale30, neverFetched };
}

async function getInventoryStats() {
  try {
    const staleBefore = new Date(Date.now() - 30 * 86400000);
    const [total, owned, withPrices, stale30, neverFetched] = await Promise.all([
      prisma.game.count(),
      prisma.game.count({ where: { copies: { some: {} } } }),
      prisma.game.count({ where: { marketLoose: { gt: 0 } } }),
      prisma.game.count({ where: { copies: { some: {} }, OR: [{ lastFetched: null }, { lastFetched: { lt: staleBefore } }] } }),
      prisma.game.count({ where: { copies: { some: {} }, lastFetched: null } }),
    ]);
    return { total, owned, withPrices, stale30, neverFetched };
  } catch { return null; }
}

function getDiskUsage() {
  const files = ['inventory.json', 'favorites.json', 'sales.json', 'tags.json', 'value-history.json'];
  let totalBytes = fileSize(getDatabasePath());
  for (const f of files) {
    totalBytes += fileSize(resolveDataPath(f));
  }
  return totalBytes;
}

function formatBytes(b: number): string {
  if (b < 1024) return `${b}B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)}KB`;
  return `${(b / 1024 / 1024).toFixed(1)}MB`;
}

function getNodeVersion(): string {
  return process.version || 'unknown';
}

function getUptime(): string {
  const upMs = Math.max(0, process.uptime() * 1000);
  const h = Math.floor(upMs / 3600000);
  const m = Math.floor((upMs % 3600000) / 60000);
  return `${h}h ${m}m`;
}

export async function GET() {
  const scrapers = getScraperStatus() as ScraperStatus[];
  const inventory = await getInventoryStats();
  const diskUsage = getDiskUsage();

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    node: getNodeVersion(),
    uptime: getUptime(),
    inventory,
    diskUsage: formatBytes(diskUsage),
    diskBytes: diskUsage,
    scrapers: scrapers.map((s) => ({
      id: s.id,
      name: s.name,
      enabled: s.enabled,
      status: s.status,
      lastRun: s.lastRun,
      lastRunStatus: s.lastRunStatus,
    })),
    logs: {
      bgFetch: readLastLine('logs/bg-fetch.log'),
      gitSync: readLastLine('logs/git-sync.log'),
      events: readLastLine('logs/events-scraper.log'),
    }
  }, { headers: { 'Cache-Control': 'no-store' } });
}
