import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { pathToFileURL } from 'url';

const testRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'retrovault-scraper-db-'));
const dataDir = path.join(testRoot, 'data');
const dbPath = path.join(dataDir, 'retrovault.db');
const storeUrl = pathToFileURL(path.join(process.cwd(), 'scripts/lib/scraper-store.mjs')).href;

describe('scraper store', () => {
  beforeAll(() => {
    fs.mkdirSync(dataDir, { recursive: true });
    process.env.RETROVAULT_DATA_DIR = dataDir;
    process.env.RETROVAULT_DB_PATH = dbPath;
    process.env.DATABASE_URL = `file:${dbPath}`;
    execFileSync('npx', ['prisma', 'migrate', 'deploy'], {
      cwd: path.resolve(import.meta.dirname, '../..'),
      env: process.env,
      stdio: 'pipe',
    });
  }, 30_000);

  beforeEach(async () => {
    vi.resetModules();
    const { createScraperStore } = await import(storeUrl);
    const store = createScraperStore();
    await store.resetForTests();
  });

  it('reads owned physical inventory from Prisma instead of legacy JSON', async () => {
    fs.writeFileSync(path.join(dataDir, 'inventory.json'), JSON.stringify([
      { id: 'legacy-unowned', title: 'Legacy', platform: 'NES', copies: [] },
    ]));
    const { createScraperStore } = await import(storeUrl);
    const store = createScraperStore();
    await store.seedGameForTests({ id: 'db-owned', title: 'Super Mario World', platform: 'SNES', copies: [{ id: 'copy-1', condition: 'Loose' }] });
    const owned = await store.listOwnedPhysicalGames();
    expect(owned).toHaveLength(1);
    expect(owned[0]).toMatchObject({ id: 'db-owned', title: 'Super Mario World', platform: 'SNES' });
  });

  it('persists fetched prices and daily history in Prisma', async () => {
    const { createScraperStore } = await import(storeUrl);
    const store = createScraperStore();
    await store.seedGameForTests({ id: 'db-owned', title: 'Super Mario World', platform: 'SNES', copies: [{ id: 'copy-1', condition: 'Loose' }] });
    await store.updateGamePrice('db-owned', { loose: 16.61, cib: 627.5, newPrice: 1375, graded: null, fetchedAt: '2026-08-24T19:33:50.116Z' });
    const game = await store.getGameForTests('db-owned');
    expect(game).toMatchObject({ marketLoose: 16.61, marketCib: 627.5, marketNew: 1375 });
    expect(game?.priceHistory).toHaveLength(1);
    expect(game?.priceHistory[0]).toMatchObject({ date: '2026-08-24', loose: 16.61, cib: 627.5 });
  });

  it('preserves known price fields when a fetch returns only partial prices', async () => {
    const { createScraperStore } = await import(storeUrl);
    const store = createScraperStore();
    await store.seedGameForTests({ id: 'partial', title: 'Partial Price', platform: 'NES', marketLoose: 10, marketCib: 20, marketNew: 30 });
    await store.updateGamePrice('partial', { loose: 11, cib: null, newPrice: null, graded: null, fetchedAt: '2026-08-24T20:00:00.000Z' });
    expect(await store.getGameForTests('partial')).toMatchObject({ marketLoose: 11, marketCib: 20, marketNew: 30 });
  });

  it('defaults to the same cwd-relative database path as the application', async () => {
    const { resolveDatabaseUrl } = await import(storeUrl);
    expect(resolveDatabaseUrl({}, '/srv/retrovault')).toBe('file:/srv/retrovault/data/retrovault.db');
  });

  it('creates the daily collection value snapshot from Prisma inventory', async () => {
    const { createScraperStore } = await import(storeUrl);
    const store = createScraperStore();
    await store.seedGameForTests({ id: 'valued', title: 'Valued Game', platform: 'NES', copies: [{ id: 'copy-valued', condition: 'Loose', priceAcquired: 12.5 }], marketLoose: 30, marketCib: 45 });
    const snapshot = await store.createDailyValueSnapshot('2026-08-24');
    expect(snapshot).toMatchObject({ date: '2026-08-24', totalValue: 30, totalCib: 45, totalPaid: 12.5, gameCount: 1 });
  });


  it('treats an empty event reconciliation as a no-op', async () => {
    const { createScraperStore } = await import(storeUrl);
    const store = createScraperStore();
    await store.seedEventForTests({ id: 'existing', title: 'Existing', dateRaw: '2026-09-01', source: 'eventbrite' });
    expect(await store.upsertScrapedEvents([])).toEqual({ upserted: 0, removed: 0 });
    expect(await store.getEventForTests('existing')).not.toBeNull();
  });

  it('upserts scraped events while preserving user-managed fields', async () => {
    const { createScraperStore } = await import(storeUrl);
    const store = createScraperStore();
    await store.seedEventForTests({ id: 'eb-legacy-random', title: 'Retro Game Expo', dateRaw: '2026-09-01', location: 'Old Venue', source: 'eventbrite', attending: true, interested: true, notes: 'Bring carts' });
    await store.upsertScrapedEvents([{ id: 'eb-stable', title: 'Retro Game Expo', dateRaw: '2026-09-01', date: '2026-09-01', location: 'New Venue', venue: 'Hall A', url: 'https://events.test/1', source: 'eventbrite' }]);
    const event = await store.getEventForTests('eb-legacy-random');
    expect(event).toMatchObject({ location: 'New Venue', attending: true, interested: true, notes: 'Bring carts' });
    expect(await store.getEventForTests('eb-stable')).toBeNull();
  });


  it('reconciles automated Whatnot streams while preserving manual streams and attendance', async () => {
    const { createScraperStore } = await import(storeUrl);
    const store = createScraperStore();
    await store.seedWhatnotForTests({
      sellers: [{ username: 'seller', displayName: 'Seller' }],
      streams: [
        { id: 'manual', seller: 'seller', title: 'Manual', url: 'https://manual', source: 'manual', attending: true },
        { id: 'auto', seller: 'seller', title: 'Old title', url: 'https://auto', source: 'whatnot-jsonld', attending: true },
        { id: 'stale', seller: 'seller', title: 'Stale', url: 'https://stale', source: 'whatnot-jsonld' },
      ],
    });
    await store.reconcileAutomatedWhatnotStreams([]);
    expect(await store.listWhatnotStreamsForTests()).toHaveLength(3);
    await store.reconcileAutomatedWhatnotStreams([
      { id: 'auto', seller: 'seller', title: 'New title', startTime: '2026-09-01T20:00:00Z', url: 'https://auto', source: 'whatnot-jsonld' },
    ]);
    const streams = await store.listWhatnotStreamsForTests();
    expect(streams.map((stream: { id: string }) => stream.id)).toEqual(['auto', 'manual']);
    expect(streams.find((stream: { id: string }) => stream.id === 'auto')).toMatchObject({ title: 'New title', attending: true });
    expect(streams.find((stream: { id: string }) => stream.id === 'manual')).toMatchObject({ attending: true, source: 'manual' });
  });

  it('adds catalog games without clobbering existing ownership or price fields', async () => {
    const { createScraperStore } = await import(storeUrl);
    const store = createScraperStore();
    await store.seedGameForTests({ id: 'legacy-random-id', title: 'Zelda', platform: 'NES', copies: [{ id: 'copy-zelda', condition: 'Loose' }], marketLoose: 33 });
    const result = await store.upsertCatalogGames([
      { id: 'nes-zelda', title: 'Zelda', platform: 'NES' },
      { id: 'nes-metroid', title: 'Metroid', platform: 'NES' },
    ]);
    expect(result).toEqual({ added: 1, existing: 1 });
    const existing = await store.getGameForTests('legacy-random-id');
    expect(existing.marketLoose).toBe(33);
    expect(existing.copies).toHaveLength(1);
    expect((await store.getGameForTests('nes-metroid'))?.title).toBe('Metroid');
  });

});


describe('price fetch job', () => {
  it('updates canonical prices from the application lookup API', async () => {
    const { run } = await import(pathToFileURL(path.join(process.cwd(), 'scripts/bg-fetch.mjs')).href);
    const updates: Array<[string, unknown]> = [];
    const store = {
      listOwnedPhysicalGames: async () => [{ id: 'game-1', title: 'Super Mario World', platform: 'SNES', lastFetched: null, marketLoose: null }],
      updateGamePrice: async (id: string, value: unknown) => { updates.push([id, value]); },
      disconnect: async () => undefined,
    };
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ loose: '16.61', cib: '62.75', new: '137.50', graded: 'N/A' }), { status: 200 }));
    const result = await run({ store, fetchImpl });
    expect(result).toMatchObject({ attempted: 1, updated: 1, errors: 0 });
    expect(updates[0]).toMatchObject(['game-1', { loose: 16.61, cib: 62.75, newPrice: 137.5, graded: null }]);
  });

  it('fails visibly when a multi-item price run only partially succeeds', async () => {
    const { run } = await import(pathToFileURL(path.join(process.cwd(), 'scripts/bg-fetch.mjs')).href);
    const store = {
      listOwnedPhysicalGames: async () => [
        { id: 'good', title: 'Good', platform: 'SNES', lastFetched: null },
        { id: 'failed', title: 'Failed', platform: 'SNES', lastFetched: null },
      ],
      updateGamePrice: vi.fn(),
      disconnect: async () => undefined,
    };
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ loose: '10.00' }), { status: 200 }))
      .mockResolvedValueOnce(new Response('upstream failure', { status: 503 }));
    await expect(run({ store, fetchImpl, limit: 2, delayMs: 0 })).rejects.toThrow('Price fetch incomplete');
    expect(store.updateGamePrice).toHaveBeenCalledTimes(1);
  });

  it('fails instead of reporting success when no prices can be updated', async () => {
    const { run } = await import(pathToFileURL(path.join(process.cwd(), 'scripts/bg-fetch.mjs')).href);
    const store = {
      listOwnedPhysicalGames: async () => [{ id: 'game-1', title: 'Missing', platform: 'SNES', lastFetched: null }],
      updateGamePrice: vi.fn(),
      disconnect: async () => undefined,
    };
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ loose: 'N/A', cib: 'N/A', new: 'N/A', graded: 'N/A' }), { status: 200 }));
    await expect(run({ store, fetchImpl })).rejects.toThrow('No prices updated');
    expect(store.updateGamePrice).not.toHaveBeenCalled();
  });
});
