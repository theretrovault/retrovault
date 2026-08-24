import { describe, expect, it } from 'vitest';
import { calculateInventoryStats } from '@/app/api/health/route';

describe('health inventory stats', () => {
  it('calculates health from canonical inventory rows, including owned stale games', () => {
    const stats = calculateInventoryStats([
      { copies: [{ id: 'copy-1' }], marketLoose: 25, lastFetched: '2020-01-01T00:00:00.000Z' },
      { copies: [], marketLoose: null, lastFetched: null },
    ]);

    expect(stats).toEqual({ total: 2, owned: 1, withPrices: 1, stale30: 1, neverFetched: 0 });
  });
});
