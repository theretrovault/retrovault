import { NextResponse } from 'next/server';
import fs from 'fs';
import { evaluateAchievements, type AchievementContext } from '@/data/achievements';
import { readDataFile, writeDataFile } from '@/lib/data';
import { resolveDataPath } from '@/lib/runtimePaths';

export const dynamic = 'force-dynamic';

const read = <T,>(file: string, fallback: T): T => readDataFile(file, fallback);

// Manually unlocked achievements (stored in data/achievements-unlocked.json)
const UNLOCKED_FILE = resolveDataPath('achievements-unlocked.json');
function loadManual(): string[] {
  if (!fs.existsSync(UNLOCKED_FILE)) return [];
  return JSON.parse(fs.readFileSync(UNLOCKED_FILE, 'utf8'));
}
function saveManual(ids: string[]) {
  writeDataFile('achievements-unlocked.json', [...new Set(ids)]);
}

function buildContext(): AchievementContext {
  const inventory = read<any[]>('inventory.json', []);
  const sales = read<{ sales: any[]; acquisitions: any[] }>('sales.json', { sales: [], acquisitions: [] });
  const favorites = read<{ people: any[]; favorites: Record<string, string[]>; regrets: Record<string, string[]> }>('favorites.json', { people: [], favorites: {}, regrets: {} });
  const playlog = read<any[]>('playlog.json', []);
  const grails = read<any[]>('grails.json', []);
  const watchlist = read<any[]>('watchlist.json', []);
  const tags = read<{ gameTags: Record<string, string[]>; platformTags: Record<string, string[]>; mentions: Record<string, any[]> }>('tags.json', { gameTags: {}, platformTags: {}, mentions: {} });
  const events = read<any[]>('events.json', []);
  const whatnot = read<{ sellers: any[]; streams: any[] }>('whatnot.json', { sellers: [], streams: [] });
  const scrapers = read<any[]>('scrapers.json', []);
  const clDeals = read<any[]>('craigslist-deals.json', []);

  const owned = inventory.filter((i: any) => (i.copies || []).length > 0 && !i.isDigital);
  const platforms = [...new Set(owned.map((i: any) => i.platform))] as string[];

  const platformCounts: Record<string, number> = {};
  for (const i of owned) {
    platformCounts[i.platform] = (platformCounts[i.platform] || 0) + 1;
  }

  const saleList = sales.sales || [];
  const totalRevenue = saleList.reduce((s: number, sale: any) => s + (parseFloat(sale.salePrice) || 0), 0);
  const totalSpent = owned.reduce((s: number, i: any) =>
    s + (i.copies || []).reduce((cs: number, c: any) => cs + (parseFloat(c.priceAcquired) || 0), 0), 0);

  // Compute best flip ROI
  const acqMap: Record<string, number> = {};
  for (const acq of (sales.acquisitions || [])) {
    acqMap[acq.gameId] = (acqMap[acq.gameId] || 0) + (parseFloat(acq.cost) || 0);
  }
  let bestFlipRoi = 0;
  for (const sale of saleList) {
    const cost = acqMap[sale.gameId] || 0;
    if (cost > 0) {
      const roi = ((parseFloat(sale.salePrice) - cost) / cost) * 100;
      if (roi > bestFlipRoi) bestFlipRoi = roi;
    }
  }

  // Price history depth
  let maxHistoryDays = 0;
  for (const item of inventory) {
    if (item.priceHistory) {
      const dates = Object.keys(item.priceHistory).sort();
      if (dates.length >= 2) {
        const d1 = new Date(dates[0]);
        const d2 = new Date(dates[dates.length - 1]);
        const days = Math.floor((d2.getTime() - d1.getTime()) / 86400000);
        if (days > maxHistoryDays) maxHistoryDays = days;
      }
    }
  }

  // Sources
  const sources: string[] = [...new Set(owned.map((i: any) => i.source).filter(Boolean))] as string[];

  // Tags & mentions
  const allGameTags = Object.values(tags.gameTags || {}) as string[][];
  const totalTags = allGameTags.reduce((s, arr) => s + arr.length, 0);
  const allMentions = Object.values(tags.mentions || {}) as any[][];
  const totalMentions = allMentions.reduce((s, arr) => s + arr.length, 0);

  // Favorites
  const allFavs = Object.values(favorites.favorites || {}) as string[][];
  const totalFavorites = allFavs.reduce((s, arr) => s + arr.length, 0);
  const allRegs = Object.values(favorites.regrets || {}) as string[][];
  const totalRegrets = allRegs.reduce((s, arr) => s + arr.length, 0);

  // Playlog
  const beaten = playlog.filter((p: any) => p.status === 'beat').length;
  const gaveUp = playlog.filter((p: any) => p.status === 'gave_up').length;
  const playing = playlog.filter((p: any) => p.status === 'playing').length;
  const backlog = playlog.filter((p: any) => p.status === 'backlog').length;
  const ratings5 = playlog.filter((p: any) => p.rating === 5).length;
  const ratings1 = playlog.filter((p: any) => p.rating === 1).length;

  // Convention sessions & spending
  const conventionSessions = (() => {
    // convention data is stored in localStorage — approximate from scraper data
    return events.filter((e: any) => e.attending).length;
  })();

  // Scraper runs
  const scraperRuns = scrapers.filter((s: any) => s.lastRun !== null).length;

  // Value history days (proxy for uptime)
  const valueHistory = read<any[]>('value-history.json', []);
  const valueHistoryDays = valueHistory.length;
  // Uptime = days since first value snapshot
  let uptimeDays = 0;
  if (valueHistory.length > 0) {
    const first = new Date(valueHistory[0].date || valueHistory[0].fetchedAt || 0);
    uptimeDays = Math.floor((Date.now() - first.getTime()) / 86400000);
  }

  // API keys + setup wizard mode
  const cfg = read<Record<string, any>>('app.config.json', {});
  const apiKeysCreated = (cfg.apiKeys || []).length;
  const setupWizardMode = (cfg.setupWizardMode as 'collector' | 'dealer' | 'empire' | null) ?? null;
  const setupWizardDone = !!cfg.setupWizardVersion;

  // Wishlist (from SQLite via data file fallback — use JSON count for now)
  // The wishlist is stored in SQLite, so we do a quick DB count
  let wishlistCount = 0;
  let wishlistFound = 0;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Database = require('better-sqlite3');
    const dbPath = resolveDataPath('retrovault.db');
    const db = new Database(dbPath, { readonly: true });
    wishlistCount = (db.prepare('SELECT COUNT(*) as c FROM WishlistItem').get() as { c: number }).c;
    wishlistFound = (db.prepare('SELECT COUNT(*) as c FROM WishlistItem WHERE foundAt IS NOT NULL').get() as { c: number }).c;
    db.close();
  } catch { /* DB not available, defaults to 0 */ }

  // Bug reports filed
  const bugReports = read<any[]>('bug-reports.json', []);
  const bugReportsFiled = bugReports.length;

  // Export/import flags (check for non-empty data files as proxy)
  const collectionExported = valueHistory.length > 0; // If they have history, they've been running long enough to export
  const csvImported = owned.some((i: any) => i.source && i.source.toLowerCase().includes('import'));

  return {
    totalOwned: owned.length,
    totalPlatforms: platforms.length,
    totalCatalog: inventory.length,
    platformCounts,
    totalSpent,
    totalRevenue,
    totalSales: saleList.length,
    totalProfit: totalRevenue - totalSpent,
    bestFlipRoi,
    hasMarketData: inventory.some((i: any) => i.marketLoose),
    priceHistoryDays: maxHistoryDays,
    watchlistCount: watchlist.length,
    grailCount: grails.length,
    grailsFound: grails.filter((g: any) => g.acquiredAt).length,
    playlogCount: playlog.length,
    gamesBeaten: beaten,
    gamesGivenUp: gaveUp,
    currentlyPlaying: playing,
    backlogCount: backlog,
    ratingsFive: ratings5,
    ratingsOne: ratings1,
    criticCount: (favorites.people || []).length,
    totalFavorites,
    totalRegrets,
    totalTags,
    totalMentions,
    eventsAttending: events.filter((e: any) => e.attending).length,
    conventionSessions,
    conventionSpent: 0, // stored in localStorage
    sources,
    sourceCount: sources.length,
    nesOwned: platformCounts['NES'] || 0,
    snesOwned: platformCounts['SNES'] || 0,
    n64Owned: platformCounts['N64'] || 0,
    genesisOwned: platformCounts['Sega Genesis'] || 0,
    dreamcastOwned: platformCounts['Dreamcast'] || 0,
    ps1Owned: platformCounts['PS1'] || 0,
    ps2Owned: platformCounts['PS2'] || 0,
    gamecubeOwned: platformCounts['Gamecube'] || 0,
    xboxOwned: platformCounts['Xbox'] || 0,
    switchOwned: platformCounts['Switch'] || 0,
    pspOwned: platformCounts['PSP'] || 0,
    ps3Owned: platformCounts['PS3'] || 0,
    xbox360Owned: platformCounts['Xbox 360'] || 0,
    segaCdOwned: platformCounts['Sega CD'] || 0,
    scraperRuns,
    dealsDismissed: clDeals.filter((d: any) => d.dismissed).length,
    whatnotSellers: (whatnot.sellers || []).length,
    streamsWatched: (whatnot.streams || []).filter((s: any) => s.attending).length,
    // System / power user
    apiKeysCreated,
    bugReportsFiled,
    collectionExported,
    csvImported,
    valueHistoryDays,
    uptimeDays,
    setupWizardMode,
    setupWizardDone,
    wishlistCount,
    wishlistFound,
  };
}

export async function GET() {
  const ctx = buildContext();
  const auto = evaluateAchievements(ctx);
  const manual = loadManual();
  const allUnlocked = [...new Set([...auto, ...manual])];

  return NextResponse.json({
    context: ctx,
    unlockedIds: allUnlocked,
    autoCount: auto.size,
    manualCount: manual.length,
  }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: Request) {
  const { action, id } = await req.json();
  if (action === 'unlock_manual') {
    const manual = loadManual();
    if (!manual.includes(id)) { manual.push(id); saveManual(manual); }
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
