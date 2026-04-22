import { NextResponse } from 'next/server';
import fs from 'fs';
import { resolveDataPath } from '@/lib/runtimeDataPaths';
import { resolveLogPath } from '@/lib/runtimePaths';

export const dynamic = 'force-dynamic';

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

function getInventoryStats() {
  try {
    const inv = JSON.parse(fs.readFileSync(resolveDataPath('inventory.json'), 'utf8'));
    const owned = inv.filter((i: any) => (i.copies || []).length > 0).length;
    const withPrices = inv.filter((i: any) => i.marketLoose && parseFloat(i.marketLoose) > 0).length;
    const stale30 = inv.filter((i: any) => {
      if (!i.lastFetched) return (i.copies || []).length > 0;
      const days = (Date.now() - new Date(i.lastFetched).getTime()) / 86400000;
      return days > 30 && (i.copies || []).length > 0;
    }).length;
    const neverFetched = inv.filter((i: any) => !i.lastFetched && (i.copies || []).length > 0).length;
    return { total: inv.length, owned, withPrices, stale30, neverFetched };
  } catch { return null; }
}

function getDiskUsage() {
  const files = ['inventory.json', 'favorites.json', 'sales.json', 'tags.json', 'value-history.json'];
  let totalBytes = 0;
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
  const scrapers = getScraperStatus();
  const inventory = getInventoryStats();
  const diskUsage = getDiskUsage();

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    node: getNodeVersion(),
    uptime: getUptime(),
    inventory,
    diskUsage: formatBytes(diskUsage),
    diskBytes: diskUsage,
    scrapers: scrapers.map((s: any) => ({
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
