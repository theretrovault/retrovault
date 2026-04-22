import fs from 'fs';
import { evaluateAchievements, type AchievementContext } from '@/data/achievements';
import { readDataFile } from '@/lib/data';
import prisma from '@/lib/prisma';
import { resolveDataPath } from '@/lib/runtimeDataPaths';

const read = <T,>(file: string, fallback: T): T => readDataFile(file, fallback);

export function getAchievementsUnlockedPath() {
  return resolveDataPath('achievements-unlocked.json');
}

export function loadManualAchievements(): string[] {
  const unlockedFile = getAchievementsUnlockedPath();
  if (!fs.existsSync(unlockedFile)) return [];
  return JSON.parse(fs.readFileSync(unlockedFile, 'utf8'));
}

export function readWishlistCounts(): { wishlistCount: number; wishlistFound: number } {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Database = require('better-sqlite3');
    const dbPath = resolveDataPath('retrovault.db');
    const db = new Database(dbPath, { readonly: true });
    const wishlistCount = (db.prepare('SELECT COUNT(*) as c FROM WishlistItem').get() as { c: number }).c;
    const wishlistFound = (db.prepare('SELECT COUNT(*) as c FROM WishlistItem WHERE foundAt IS NOT NULL').get() as { c: number }).c;
    db.close();
    return { wishlistCount, wishlistFound };
  } catch {
    return { wishlistCount: 0, wishlistFound: 0 };
  }
}

async function readWishlistShared(): Promise<boolean> {
  try {
    const share = await prisma.wishlistShare.findFirst({ orderBy: { createdAt: 'desc' } });
    return !!share;
  } catch {
    return false;
  }
}

export async function buildAchievementContext(): Promise<AchievementContext> {
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
  const valueHistory = read<any[]>('value-history.json', []);
  const bugReports = read<any[]>('bug-reports.json', []);
  const cfg = read<Record<string, any>>('app.config.json', {});

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

  const sources: string[] = [...new Set(owned.map((i: any) => i.source).filter(Boolean))] as string[];
  const allGameTags = Object.values(tags.gameTags || {}) as string[][];
  const totalTags = allGameTags.reduce((s, arr) => s + arr.length, 0);
  const allMentions = Object.values(tags.mentions || {}) as any[][];
  const totalMentions = allMentions.reduce((s, arr) => s + arr.length, 0);
  const allFavs = Object.values(favorites.favorites || {}) as string[][];
  const totalFavorites = allFavs.reduce((s, arr) => s + arr.length, 0);
  const allRegs = Object.values(favorites.regrets || {}) as string[][];
  const totalRegrets = allRegs.reduce((s, arr) => s + arr.length, 0);

  const beaten = playlog.filter((p: any) => p.status === 'beat').length;
  const gaveUp = playlog.filter((p: any) => p.status === 'gave_up').length;
  const playing = playlog.filter((p: any) => p.status === 'playing').length;
  const backlog = playlog.filter((p: any) => p.status === 'backlog').length;
  const ratings5 = playlog.filter((p: any) => p.rating === 5).length;
  const ratings1 = playlog.filter((p: any) => p.rating === 1).length;
  const conventionSessions = events.filter((e: any) => e.attending).length;
  const scraperRuns = scrapers.filter((s: any) => s.lastRun !== null).length;

  let uptimeDays = 0;
  if (valueHistory.length > 0) {
    const first = new Date(valueHistory[0].date || valueHistory[0].fetchedAt || 0);
    uptimeDays = Math.floor((Date.now() - first.getTime()) / 86400000);
  }

  const apiKeysCreated = (cfg.apiKeys || []).length;
  const setupWizardMode = (cfg.setupWizardMode as 'collector' | 'dealer' | 'empire' | null) ?? null;
  const setupWizardDone = !!cfg.setupWizardVersion;
  const authConfigured = !!cfg.auth?.enabled && !!cfg.auth?.passwordHash;
  const themeCustomized = !!cfg.themeColor && cfg.themeColor !== 'green';
  const { wishlistCount, wishlistFound } = readWishlistCounts();
  const wishlistShared = await readWishlistShared();
  const wishlistMustHaveCount = await prisma.wishlistItem.count({ where: { priority: 1 } }).catch(() => 0);
  const collectionExported = valueHistory.length > 0;
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
    conventionSpent: 0,
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
    apiKeysCreated,
    bugReportsFiled: bugReports.length,
    collectionExported,
    csvImported,
    valueHistoryDays: valueHistory.length,
    uptimeDays,
    setupWizardMode,
    setupWizardDone,
    authConfigured,
    themeCustomized,
    wishlistCount,
    wishlistFound,
    wishlistShared,
    wishlistMustHaveCount,
  };
}

export async function buildAchievementPayload() {
  const context = await buildAchievementContext();
  const auto = evaluateAchievements(context);
  const manual = loadManualAchievements();
  const unlockedIds = [...new Set([...auto, ...manual])];

  return {
    context,
    unlockedIds,
    autoCount: auto.size,
    manualCount: manual.length,
  };
}
