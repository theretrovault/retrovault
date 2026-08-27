import { describe, expect, it } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';

// Prod-data regression: replay the UI add flow against a snapshot of
// production DB + legacy JSON (fetched from the RetroVault prod container on
// Tower, 2026-08-26). The committed fixture lives in fixtures/prod-snapshot/
// and is refreshed by scripts/refresh-prod-fixture.mjs. Set RV_PROD_SIM_DIR to
// override with a different snapshot.
const COMMITTED_FIXTURE = path.join(process.cwd(), 'fixtures', 'prod-snapshot');
const SOURCE_DIR = process.env.RV_PROD_SIM_DIR || COMMITTED_FIXTURE;

// Scenario: the field page's client-side dupe detection misses (this is exactly
// what happened for Battletoads/Cool Spot - legacy JSON id differs from the
// SQLite id), so the add falls through to POST -> createInventoryCompat. The
// incoming item carries ONE new copy. The existing canonical row already has
// one copy, so the merge must result in 2 copies (existing + the new one the
// user is recording) - NOT a 500, NOT a duplicate row, NOT a dropped copy.
describe('prod snapshot: Battletoads add flow (v2.1.50 regression guard)', () => {
  it('merges the POST fallback add into the canonical Prisma row (no 500, no duplicate row)', async () => {
    if (!fs.existsSync(path.join(SOURCE_DIR, 'retrovault.db'))) {
      console.log('SKIP: no prod snapshot fixture (fixtures/prod-snapshot) or RV_PROD_SIM_DIR');
      return;
    }

    // Work on a temp copy so the committed fixture is never mutated.
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rv-prod-sim-'));
    fs.copyFileSync(path.join(SOURCE_DIR, 'retrovault.db'), path.join(tmp, 'retrovault.db'));
    for (const ext of ['retrovault.db-wal', 'retrovault.db-shm']) {
      const src = path.join(SOURCE_DIR, ext);
      if (fs.existsSync(src)) fs.copyFileSync(src, path.join(tmp, ext));
    }
    if (fs.existsSync(path.join(SOURCE_DIR, 'inventory.json'))) {
      fs.copyFileSync(path.join(SOURCE_DIR, 'inventory.json'), path.join(tmp, 'inventory.json'));
    }

    process.env.RETROVAULT_DATA_DIR = tmp;
    process.env.RETROVAULT_INVENTORY_PATH = path.join(tmp, 'inventory.json');
    process.env.RETROVAULT_DB_PATH = path.join(tmp, 'retrovault.db');
    process.env.DATABASE_URL = 'file:' + path.join(tmp, 'retrovault.db');

    // Reset the cached Prisma singleton so the freshly-set env vars take effect
    // even if a prior test in this worker already opened a connection.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).__prisma = undefined;
    const storage = await import('@/lib/storageCompat');

    const incomingId = 'sim' + Math.random().toString(36).slice(2, 10);
    const created = await storage.createInventoryCompat({
      id: incomingId,
      title: 'Battletoads',
      platform: 'Sega Genesis',
      status: 'Yes',
      notes: '',
      purchaseDate: '2026-08-26',
      isDigital: false,
      marketLoose: '0',
      marketCib: '0',
      copies: [{
        id: 'copy' + Math.random().toString(36).slice(2, 10),
        hasBox: false,
        hasManual: false,
        priceAcquired: '15.00',
        condition: 'Loose',
      }],
    });

    // The incoming random id must be merged into the canonical Prisma row.
    expect(created.id).toBe('genesis-battletoads-8fcf10f184');
    expect(created.status).toBe('Yes');
    // Existing row had 1 copy; this add records 1 more -> 2 total (no dup row).
    expect(created.copies).toHaveLength(2);

    const inventory = await storage.readInventoryCompat();
    // The readback merges DB rows + legacy JSON rows, and the prod catalog has
    // several "Battletoads"-titled entries (Double Dragon variants, other
    // platforms). Assert on the canonical row by ID, not a loose title match:
    // there must be exactly ONE row with the canonical id (no duplicate created
    // by the add), and it must be owned with 2 copies (1 existing + 1 added).
    const canonicalRows = inventory.filter(
      (x) => x.id === 'genesis-battletoads-8fcf10f184'
    );
    expect(canonicalRows.length).toBe(1);
    expect(canonicalRows[0].status).toBe('Yes');
    expect(canonicalRows[0].copies).toHaveLength(2);
    // And no stray second row for the plain "Battletoads" / "Sega Genesis" game.
    const plainBattletoads = inventory.filter(
      (x) => (x.title || '').trim().toLowerCase() === 'battletoads'
        && /genesis/i.test(x.platform || '')
    );
    expect(plainBattletoads.length).toBe(1);
    expect(plainBattletoads[0].id).toBe('genesis-battletoads-8fcf10f184');
  }, 30000);
});
