import { beforeEach, describe, expect, it } from 'vitest';
import { randomUUID } from 'crypto';

import prisma from '@/lib/prisma';
import {
  addWatchlistCompat,
  createInventoryCompat,
  deleteInventoryCompat,
  deleteWatchlistCompat,
  readInventoryCompat,
  readWatchlistCompat,
  updateInventoryCompat,
  updateWatchlistCompat,
} from '@/lib/storageCompat';

function uniqueId(prefix: string) {
  return `${prefix}-${randomUUID()}`;
}

describe('storageCompat', () => {
  beforeEach(async () => {
    await prisma.priceHistory.deleteMany();
    await prisma.gameCopy.deleteMany();
    await prisma.game.deleteMany();
    await prisma.watchlistItem.deleteMany();
  });

  it('round-trips inventory through Prisma with legacy-compatible shape', async () => {
    const id = uniqueId('game');

    await createInventoryCompat({
      id,
      title: 'Test Drive 6',
      platform: 'PlayStation',
      copies: [{ condition: 'CIB', hasBox: true, hasManual: true, priceAcquired: '12.50' }],
      marketLoose: '18.25',
      marketCib: '24.75',
      marketNew: null,
      lastFetched: '2026-04-20T12:00:00.000Z',
      priceHistory: {
        '2026-04-20': { loose: '18.25', cib: '24.75', fetchedAt: '2026-04-20T12:00:00.000Z' },
      },
    });

    const inventory = await readInventoryCompat();
    const created = inventory.find((item) => item.id === id);

    expect(created).toBeTruthy();
    expect(created?.copies).toHaveLength(1);
    expect(created?.priceHistory?.['2026-04-20']?.loose).toBe(18.25);
  });

  it('updates and deletes inventory records through compat helpers', async () => {
    const id = uniqueId('game');
    await createInventoryCompat({ id, title: 'Ecco', platform: 'Genesis', copies: [] });

    const updated = await updateInventoryCompat({
      id,
      title: 'Ecco the Dolphin',
      platform: 'Genesis',
      copies: [{ condition: 'Loose', priceAcquired: '4.00' }],
      marketLoose: '9.50',
    });

    expect(updated?.title).toBe('Ecco the Dolphin');
    expect(updated?.copies).toHaveLength(1);

    const deleted = await deleteInventoryCompat(id);
    expect(deleted).toBe(true);
    expect((await readInventoryCompat()).find((item) => item.id === id)).toBeUndefined();
  });

  it('round-trips watchlist entries through Prisma with legacy fields', async () => {
    const created = await addWatchlistCompat({
      id: uniqueId('watch'),
      title: 'Silent Hill',
      platform: 'PlayStation 2',
      targetBuyPrice: '55.00',
      notes: 'Field mode target',
    });

    expect(created.targetBuyPrice).toBe(55);

    const updated = await updateWatchlistCompat({
      ...created,
      targetBuyPrice: '50.00',
      alertPrice: '50.00',
      notes: 'Adjusted target',
    });

    expect(updated?.alertPrice).toBe(50);
    expect(updated?.notes).toBe('Adjusted target');

    const entries = await readWatchlistCompat();
    expect(entries).toHaveLength(1);
    expect(entries[0].title).toBe('Silent Hill');

    const deleted = await deleteWatchlistCompat(created.id);
    expect(deleted).toBe(true);
    expect(await readWatchlistCompat()).toHaveLength(0);
  });
});
