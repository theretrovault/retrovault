/** RetroVault daily collection-value snapshot from canonical Prisma state. */
import path from 'path';
import { fileURLToPath } from 'url';
import { createScraperStore } from './lib/scraper-store.mjs';

export async function run({ store = createScraperStore(), date = new Date().toISOString().slice(0, 10) } = {}) {
  try {
    const snapshot = await store.createDailyValueSnapshot(date);
    console.log(`Snapshot saved: ${snapshot.date} — ${snapshot.gameCount} games, $${snapshot.totalValue.toFixed(2)} loose value`);
    return snapshot;
  } finally {
    await store.disconnect?.();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run().catch((error) => {
    console.error('[snapshot-value] Fatal error:', error.message || error);
    process.exitCode = 1;
  });
}
