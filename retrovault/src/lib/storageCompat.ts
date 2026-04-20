import { prisma } from '@/lib/prisma';
import { readDataFile, writeDataFile } from '@/lib/data';

export type LegacyInventoryItem = {
  id: string;
  title: string;
  platform: string;
  status?: string;
  notes?: string;
  isDigital?: boolean;
  source?: string | null;
  purchaseDate?: string | null;
  lastFetched?: string | null;
  marketLoose?: string | number | null;
  marketCib?: string | number | null;
  marketNew?: string | number | null;
  marketGraded?: string | number | null;
  copies?: Array<{
    id?: string;
    condition?: string;
    hasBox?: boolean;
    hasManual?: boolean;
    priceAcquired?: string | number;
    purchaseDate?: string | null;
    source?: string | null;
  }>;
  priceHistory?: Record<string, {
    loose?: string | number | null;
    cib?: string | number | null;
    new?: string | number | null;
    graded?: string | number | null;
    fetchedAt?: string | null;
  }>;
};

export type LegacyWatchlistItem = {
  id: string;
  gameId?: string | null;
  title: string;
  platform: string;
  targetBuyPrice?: string | number | null;
  alertPrice?: string | number | null;
  notes?: string | null;
  createdAt?: string | null;
};

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = typeof value === 'number' ? value : parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : null;
}

function toNullableString(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;
  return String(value);
}

function safeIso(value: unknown): string | null {
  const stringValue = toNullableString(value);
  if (!stringValue) return null;
  const parsed = new Date(stringValue);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export async function readInventoryCompat(): Promise<LegacyInventoryItem[]> {
  const games = await prisma.game.findMany({
    include: {
      copies: true,
      priceHistory: true,
    },
    orderBy: [{ title: 'asc' }, { platform: 'asc' }],
  });

  return games.map((game) => ({
    id: game.id,
    title: game.title,
    platform: game.platform,
    status: game.status,
    notes: game.notes,
    isDigital: game.isDigital,
    source: game.source,
    purchaseDate: game.purchaseDate,
    lastFetched: game.lastFetched?.toISOString() ?? null,
    marketLoose: game.marketLoose ?? null,
    marketCib: game.marketCib ?? null,
    marketNew: game.marketNew ?? null,
    marketGraded: game.marketGraded ?? null,
    copies: game.copies.map((copy) => ({
      id: copy.id,
      condition: copy.condition,
      hasBox: copy.hasBox,
      hasManual: copy.hasManual,
      priceAcquired: copy.priceAcquired,
      purchaseDate: copy.purchaseDate,
      source: copy.source,
    })),
    priceHistory: Object.fromEntries(
      game.priceHistory.map((entry) => [entry.date, {
        loose: entry.loose ?? null,
        cib: entry.cib ?? null,
        new: entry.newPrice ?? null,
        graded: entry.graded ?? null,
        fetchedAt: entry.fetchedAt.toISOString(),
      }])
    ),
  }));
}

export async function createInventoryCompat(item: LegacyInventoryItem): Promise<LegacyInventoryItem> {
  const created = await prisma.game.create({
    data: {
      id: item.id,
      title: item.title,
      platform: item.platform,
      status: item.status ?? 'unowned',
      notes: item.notes ?? '',
      isDigital: Boolean(item.isDigital),
      source: toNullableString(item.source),
      purchaseDate: toNullableString(item.purchaseDate),
      lastFetched: safeIso(item.lastFetched),
      marketLoose: toNullableNumber(item.marketLoose),
      marketCib: toNullableNumber(item.marketCib),
      marketNew: toNullableNumber(item.marketNew),
      marketGraded: toNullableNumber(item.marketGraded),
      copies: {
        create: (item.copies || []).map((copy) => ({
          id: copy.id,
          condition: copy.condition || 'Loose',
          hasBox: Boolean(copy.hasBox),
          hasManual: Boolean(copy.hasManual),
          priceAcquired: toNullableNumber(copy.priceAcquired) ?? 0,
          purchaseDate: toNullableString(copy.purchaseDate),
          source: toNullableString(copy.source),
        })),
      },
      priceHistory: {
        create: Object.entries(item.priceHistory || {}).map(([date, prices]) => ({
          date,
          loose: toNullableNumber(prices?.loose),
          cib: toNullableNumber(prices?.cib),
          newPrice: toNullableNumber(prices?.new),
          graded: toNullableNumber(prices?.graded),
          fetchedAt: safeIso(prices?.fetchedAt) ?? new Date().toISOString(),
        })),
      },
    },
    include: {
      copies: true,
      priceHistory: true,
    },
  });

  return {
    id: created.id,
    title: created.title,
    platform: created.platform,
    status: created.status,
    notes: created.notes,
    isDigital: created.isDigital,
    source: created.source,
    purchaseDate: created.purchaseDate,
    lastFetched: created.lastFetched?.toISOString() ?? null,
    marketLoose: created.marketLoose ?? null,
    marketCib: created.marketCib ?? null,
    marketNew: created.marketNew ?? null,
    marketGraded: created.marketGraded ?? null,
    copies: created.copies.map((copy) => ({
      id: copy.id,
      condition: copy.condition,
      hasBox: copy.hasBox,
      hasManual: copy.hasManual,
      priceAcquired: copy.priceAcquired,
      purchaseDate: copy.purchaseDate,
      source: copy.source,
    })),
    priceHistory: Object.fromEntries(created.priceHistory.map((entry) => [entry.date, {
      loose: entry.loose ?? null,
      cib: entry.cib ?? null,
      new: entry.newPrice ?? null,
      graded: entry.graded ?? null,
      fetchedAt: entry.fetchedAt.toISOString(),
    }])),
  };
}

export async function updateInventoryCompat(item: LegacyInventoryItem): Promise<LegacyInventoryItem | null> {
  const existing = await prisma.game.findUnique({ where: { id: item.id } });
  if (!existing) return null;

  await prisma.$transaction(async (tx) => {
    await tx.game.update({
      where: { id: item.id },
      data: {
        title: item.title,
        platform: item.platform,
        status: item.status ?? 'unowned',
        notes: item.notes ?? '',
        isDigital: Boolean(item.isDigital),
        source: toNullableString(item.source),
        purchaseDate: toNullableString(item.purchaseDate),
        lastFetched: safeIso(item.lastFetched),
        marketLoose: toNullableNumber(item.marketLoose),
        marketCib: toNullableNumber(item.marketCib),
        marketNew: toNullableNumber(item.marketNew),
        marketGraded: toNullableNumber(item.marketGraded),
      },
    });

    await tx.gameCopy.deleteMany({ where: { gameId: item.id } });
    if ((item.copies || []).length > 0) {
      await tx.gameCopy.createMany({
        data: (item.copies || []).map((copy) => ({
          id: copy.id,
          gameId: item.id,
          condition: copy.condition || 'Loose',
          hasBox: Boolean(copy.hasBox),
          hasManual: Boolean(copy.hasManual),
          priceAcquired: toNullableNumber(copy.priceAcquired) ?? 0,
          purchaseDate: toNullableString(copy.purchaseDate),
          source: toNullableString(copy.source),
        })),
      });
    }

    await tx.priceHistory.deleteMany({ where: { gameId: item.id } });
    const priceEntries = Object.entries(item.priceHistory || {});
    if (priceEntries.length > 0) {
      await tx.priceHistory.createMany({
        data: priceEntries.map(([date, prices]) => ({
          gameId: item.id,
          date,
          loose: toNullableNumber(prices?.loose),
          cib: toNullableNumber(prices?.cib),
          newPrice: toNullableNumber(prices?.new),
          graded: toNullableNumber(prices?.graded),
          fetchedAt: safeIso(prices?.fetchedAt) ?? new Date().toISOString(),
        })),
      });
    }
  });

  const [updated] = await Promise.all([readInventoryCompat()]);
  return updated.find((entry) => entry.id === item.id) || null;
}

export async function deleteInventoryCompat(id: string): Promise<boolean> {
  const existing = await prisma.game.findUnique({ where: { id } });
  if (!existing) return false;
  await prisma.game.delete({ where: { id } });
  return true;
}

export async function readWatchlistCompat(): Promise<LegacyWatchlistItem[]> {
  const items = await prisma.watchlistItem.findMany({ orderBy: { createdAt: 'desc' } });
  return items.map((item) => ({
    id: item.id,
    gameId: item.gameId,
    title: item.title,
    platform: item.platform,
    targetBuyPrice: item.alertPrice,
    alertPrice: item.alertPrice,
    notes: item.notes,
    createdAt: item.createdAt.toISOString(),
  }));
}

export async function addWatchlistCompat(item: LegacyWatchlistItem): Promise<LegacyWatchlistItem> {
  const alertPrice = toNullableNumber(item.alertPrice ?? item.targetBuyPrice) ?? 0;
  const created = await prisma.watchlistItem.create({
    data: {
      gameId: toNullableString(item.gameId),
      title: item.title,
      platform: item.platform,
      alertPrice,
      notes: toNullableString(item.notes),
    },
  });

  return {
    id: created.id,
    gameId: created.gameId,
    title: created.title,
    platform: created.platform,
    targetBuyPrice: created.alertPrice,
    alertPrice: created.alertPrice,
    notes: created.notes,
    createdAt: created.createdAt.toISOString(),
  };
}

export async function updateWatchlistCompat(item: LegacyWatchlistItem): Promise<LegacyWatchlistItem | null> {
  const existing = await prisma.watchlistItem.findUnique({ where: { id: item.id } });
  if (!existing) return null;

  const updated = await prisma.watchlistItem.update({
    where: { id: item.id },
    data: {
      gameId: toNullableString(item.gameId),
      title: item.title,
      platform: item.platform,
      alertPrice: toNullableNumber(item.alertPrice ?? item.targetBuyPrice) ?? 0,
      notes: toNullableString(item.notes),
    },
  });

  return {
    id: updated.id,
    gameId: updated.gameId,
    title: updated.title,
    platform: updated.platform,
    targetBuyPrice: updated.alertPrice,
    alertPrice: updated.alertPrice,
    notes: updated.notes,
    createdAt: updated.createdAt.toISOString(),
  };
}

export async function deleteWatchlistCompat(id: string): Promise<boolean> {
  const existing = await prisma.watchlistItem.findUnique({ where: { id } });
  if (!existing) return false;
  await prisma.watchlistItem.delete({ where: { id } });
  return true;
}

export function readJsonValueHistoryCompat<T = unknown[]>(): T {
  return readDataFile('value-history.json', [] as T);
}

export function writeJsonSnapshotCompat(filename: string, data: unknown): void {
  writeDataFile(filename, data);
}
