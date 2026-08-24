import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'path';

export function resolveDatabaseUrl(env = process.env, cwd = process.cwd()) {
  if (env.DATABASE_URL) return env.DATABASE_URL;
  const dbPath = env.RETROVAULT_DB_PATH
    || path.join(env.RETROVAULT_DATA_DIR || path.join(cwd, 'data'), 'retrovault.db');
  return `file:${dbPath}`;
}

export function createScraperStore() {
  const prisma = new PrismaClient({
    adapter: new PrismaBetterSqlite3({ url: resolveDatabaseUrl() }),
  });

  return {
    async listDealTargets() {
      const [watchlist, grails] = await Promise.all([
        prisma.watchlistItem.findMany(),
        prisma.grail.findMany({ where: { acquiredAt: null } }),
      ]);
      return [
        ...watchlist.map((item) => ({ title: item.title, platform: item.platform, alertPrice: item.alertPrice, source: 'watchlist' })),
        ...grails.map((item) => ({ title: item.title, platform: item.platform, alertPrice: null, source: 'grail' })),
      ];
    },

    async listOwnedPhysicalGames() {
      return prisma.game.findMany({
        where: { isDigital: false, copies: { some: {} } },
        include: { copies: true },
        orderBy: { title: 'asc' },
      });
    },

    async updateGamePrice(gameId, prices) {
      const fetchedAt = new Date(prices.fetchedAt || Date.now());
      const date = fetchedAt.toISOString().slice(0, 10);
      const gameUpdate = { lastFetched: fetchedAt };
      const gameFields = {
        marketLoose: prices.loose,
        marketCib: prices.cib,
        marketNew: prices.newPrice,
        marketGraded: prices.graded,
      };
      for (const [field, value] of Object.entries(gameFields)) {
        if (Number.isFinite(value)) gameUpdate[field] = value;
      }
      const historyUpdate = { fetchedAt };
      const historyFields = {
        loose: prices.loose,
        cib: prices.cib,
        newPrice: prices.newPrice,
        graded: prices.graded,
      };
      for (const [field, value] of Object.entries(historyFields)) {
        if (Number.isFinite(value)) historyUpdate[field] = value;
      }
      return prisma.$transaction([
        prisma.game.update({
          where: { id: gameId },
          data: gameUpdate,
        }),
        prisma.priceHistory.upsert({
          where: { gameId_date: { gameId, date } },
          create: {
            gameId,
            date,
            loose: prices.loose ?? null,
            cib: prices.cib ?? null,
            newPrice: prices.newPrice ?? null,
            graded: prices.graded ?? null,
            fetchedAt,
          },
          update: historyUpdate,
        }),
      ]);
    },

    async upsertCatalogGames(games) {
      if (!Array.isArray(games)) throw new TypeError('games must be an array');
      const keyFor = (game) => `${String(game.title || '').trim().toLowerCase()}::${String(game.platform || '').trim().toLowerCase()}`;
      const unique = [...new Map(games.map((game) => [keyFor(game), game])).values()];
      const existingRows = await prisma.game.findMany({ select: { id: true, title: true, platform: true } });
      const existingKeys = new Set(existingRows.map(keyFor));
      const existingIds = new Set(existingRows.map((game) => game.id));
      const additions = unique.filter((game) => !existingKeys.has(keyFor(game)) && !existingIds.has(game.id));
      if (additions.length) {
        await prisma.game.createMany({ data: additions.map((game) => ({ id: game.id, title: game.title, platform: game.platform })) });
      }
      return { added: additions.length, existing: unique.length - additions.length };
    },

    async upsertScrapedEvents(events) {
      if (!Array.isArray(events)) throw new TypeError('events must be an array');
      if (!events.length) return { upserted: 0, removed: 0 };
      if (!events.length) return { upserted: 0, removed: 0 };
      return prisma.$transaction(async (tx) => {
        const retainedIds = [];
        for (const event of events) {
          const dateRaw = event.dateRaw || event.date || '';
          const source = event.source || 'eventbrite';
          const data = {
            title: event.title,
            dateRaw,
            date: event.date || null,
            location: event.location || '',
            venue: event.venue || null,
            url: event.url || null,
            source,
            description: event.description || null,
            scrapedAt: event.scrapedAt ? new Date(event.scrapedAt) : new Date(),
          };
          const existing = await tx.event.findFirst({
            where: { OR: [{ id: event.id }, { title: event.title, dateRaw, source }] },
            select: { id: true },
          });
          if (existing) {
            await tx.event.update({ where: { id: existing.id }, data });
            retainedIds.push(existing.id);
          } else {
            await tx.event.create({ data: { id: event.id, ...data } });
            retainedIds.push(event.id);
          }
        }
        const removed = await tx.event.deleteMany({
          where: {
            source: 'eventbrite',
            id: { notIn: retainedIds },
            attending: false,
            interested: false,
            notes: null,
          },
        });
        return { upserted: retainedIds.length, removed: removed.count };
      });
    },

    async listWhatnotSellers() {
      return prisma.whatnotSeller.findMany({ orderBy: { username: 'asc' } });
    },

    async reconcileAutomatedWhatnotStreams(streams) {
      if (!Array.isArray(streams)) throw new TypeError('streams must be an array');
      if (!streams.length) return { upserted: 0 };
      const ids = streams.map((stream) => stream.id);
      await prisma.$transaction(async (tx) => {
        for (const stream of streams) {
          await tx.whatnotStream.upsert({
            where: { id: stream.id },
            update: {
              seller: stream.seller,
              title: stream.title,
              startTime: stream.startTime ? new Date(stream.startTime) : null,
              scheduledText: stream.scheduledText || null,
              url: stream.url,
              source: stream.source,
            },
            create: {
              id: stream.id,
              seller: stream.seller,
              title: stream.title,
              startTime: stream.startTime ? new Date(stream.startTime) : null,
              scheduledText: stream.scheduledText || null,
              url: stream.url,
              source: stream.source,
              attending: false,
            },
          });
        }
        await tx.whatnotStream.deleteMany({
          where: { source: { not: 'manual' }, ...(ids.length ? { id: { notIn: ids } } : {}) },
        });
      });
      return { upserted: streams.length };
    },

    async createDailyValueSnapshot(date = new Date().toISOString().slice(0, 10)) {
      const games = await prisma.game.findMany({
        where: { isDigital: false, copies: { some: {} } },
        include: { copies: true },
      });
      const totals = games.reduce((acc, game) => {
        acc.totalValue += game.marketLoose || 0;
        acc.totalCib += game.marketCib ?? game.marketLoose ?? 0;
        acc.totalPaid += game.copies.reduce((sum, copy) => sum + (copy.priceAcquired || 0), 0);
        return acc;
      }, { totalValue: 0, totalCib: 0, totalPaid: 0 });
      return prisma.valueSnapshot.upsert({
        where: { date },
        create: { date, ...totals, gameCount: games.length },
        update: { ...totals, gameCount: games.length },
      });
    },

    async disconnect() {
      await prisma.$disconnect();
    },

    // Test helpers deliberately remain narrow and are not used by production jobs.
    async resetForTests() {
      if (process.env.NODE_ENV !== 'test') throw new Error('resetForTests is test-only');
      await prisma.whatnotStream.deleteMany();
      await prisma.whatnotSeller.deleteMany();
      await prisma.event.deleteMany();
      await prisma.valueSnapshot.deleteMany();
      await prisma.priceHistory.deleteMany();
      await prisma.gameCopy.deleteMany();
      await prisma.game.deleteMany();
    },

    async seedGameForTests(game) {
      if (process.env.NODE_ENV !== 'test') throw new Error('seedGameForTests is test-only');
      return prisma.game.create({
        data: {
          id: game.id,
          title: game.title,
          platform: game.platform,
          isDigital: Boolean(game.isDigital),
          marketLoose: game.marketLoose ?? null,
          marketCib: game.marketCib ?? null,
          marketNew: game.marketNew ?? null,
          copies: {
            create: (game.copies || []).map((copy) => ({
              id: copy.id,
              condition: copy.condition || 'Loose',
              priceAcquired: copy.priceAcquired || 0,
            })),
          },
        },
      });
    },

    async getGameForTests(id) {
      if (process.env.NODE_ENV !== 'test') throw new Error('getGameForTests is test-only');
      return prisma.game.findUnique({ where: { id }, include: { priceHistory: true, copies: true } });
    },

    async seedWhatnotForTests({ sellers = [], streams = [] }) {
      if (process.env.NODE_ENV !== 'test') throw new Error('seedWhatnotForTests is test-only');
      if (sellers.length) await prisma.whatnotSeller.createMany({ data: sellers });
      if (streams.length) await prisma.whatnotStream.createMany({ data: streams });
    },

    async listWhatnotStreamsForTests() {
      if (process.env.NODE_ENV !== 'test') throw new Error('listWhatnotStreamsForTests is test-only');
      return prisma.whatnotStream.findMany({ orderBy: { id: 'asc' } });
    },

    async seedEventForTests(event) {
      if (process.env.NODE_ENV !== 'test') throw new Error('seedEventForTests is test-only');
      return prisma.event.create({ data: {
        id: event.id, title: event.title, dateRaw: event.dateRaw,
        date: event.date || null, location: event.location || '',
        attending: Boolean(event.attending), interested: Boolean(event.interested),
        notes: event.notes || null, source: event.source || 'manual',
      } });
    },

    async getEventForTests(id) {
      if (process.env.NODE_ENV !== 'test') throw new Error('getEventForTests is test-only');
      return prisma.event.findUnique({ where: { id } });
    },
  };
}
