/**
 * RetroVault Price Fetcher — canonical Prisma-backed mode.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createScraperStore } from './lib/scraper-store.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = process.env.RETROVAULT_DATA_DIR || path.join(__dirname, '..', 'data');
const lockPath = path.join(dataDir, 'fetch.lock');
const DAILY_LIMIT = Number.parseInt(process.env.FETCH_LIMIT || '500', 10);
const DELAY_MS = Number.parseInt(process.env.FETCH_DELAY_MS || '2500', 10);
const BASE_URL = (process.env.RETROVAULT_BASE_URL || `http://127.0.0.1:${process.env.PORT || '3000'}`).replace(/\/$/, '');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const isLocked = () => fs.existsSync(lockPath);

async function waitForUnlock(label) {
  if (!isLocked()) return;
  console.log(`[bg-fetch] UI lock detected on "${label}", pausing...`);
  while (isLocked()) await sleep(5000);
  console.log('[bg-fetch] Lock released, resuming...');
}

function parsePrice(value) {
  if (value == null || value === 'N/A') return null;
  const parsed = Number.parseFloat(String(value).replace(/[$,]/g, '').trim());
  return Number.isFinite(parsed) ? parsed : null;
}

export async function getPrice(title, platform, fetchImpl = fetch) {
  const params = new URLSearchParams({ title, platform });
  const response = await fetchImpl(`${BASE_URL}/api/pricecharting?${params}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`Price lookup HTTP ${response.status}`);
  const body = await response.json();
  if (body.error) throw new Error(body.message || body.error);
  return {
    loose: parsePrice(body.loose),
    cib: parsePrice(body.cib),
    newPrice: parsePrice(body.new),
    graded: parsePrice(body.graded),
  };
}

export async function run({ store = createScraperStore(), fetchImpl = fetch, limit = DAILY_LIMIT, delayMs = DELAY_MS } = {}) {
  try {
    const owned = await store.listOwnedPhysicalGames();
    const today = new Date().toISOString().slice(0, 10);
    console.log(`[bg-fetch] Canonical inventory | Owned physical: ${owned.length}`);

    const needsFetch = owned.filter((item) => !item.lastFetched || new Date(item.lastFetched).toISOString().slice(0, 10) !== today);
    const prioritized = [...needsFetch].sort((a, b) => {
      const aFetched = a.lastFetched ? new Date(a.lastFetched).getTime() : 0;
      const bFetched = b.lastFetched ? new Date(b.lastFetched).getTime() : 0;
      if (!a.lastFetched && b.lastFetched) return -1;
      if (a.lastFetched && !b.lastFetched) return 1;
      if (aFetched !== bFetched) return aFetched - bFetched;
      return (b.marketLoose || 0) - (a.marketLoose || 0);
    });
    const toFetch = prioritized.slice(0, limit);
    console.log(`[bg-fetch] Need fetch: ${needsFetch.length} | This run: ${toFetch.length} (limit: ${limit})`);
    if (!toFetch.length) return { attempted: 0, updated: 0, noData: 0, errors: 0 };

    let updated = 0;
    let noData = 0;
    let errors = 0;
    for (let i = 0; i < toFetch.length; i += 1) {
      const item = toFetch[i];
      try {
        const prices = await getPrice(item.title, item.platform, fetchImpl);
        if ([prices.loose, prices.cib, prices.newPrice, prices.graded].every((value) => value == null)) {
          noData += 1;
          console.warn(`[${i + 1}/${toFetch.length}] No confident price match: ${item.title} (${item.platform})`);
        } else {
          const fetchedAt = new Date().toISOString();
          await store.updateGamePrice(item.id, { ...prices, fetchedAt });
          updated += 1;
          console.log(`[${i + 1}/${toFetch.length}] Updated ${item.title} (${item.platform})`);
        }
      } catch (error) {
        errors += 1;
        console.error(`[${i + 1}/${toFetch.length}] Error on "${item.title}": ${error.message}`);
      }
      if (i + 1 < toFetch.length && delayMs > 0) await sleep(delayMs);
      await waitForUnlock(item.title);
    }

    const result = { attempted: toFetch.length, updated, noData, errors };
    console.log(`[bg-fetch] Complete: ${JSON.stringify(result)}`);
    if (errors > 0) throw new Error(`Price fetch incomplete (${updated} updated, ${noData} no-match, ${errors} errors)`);
    if (updated === 0) throw new Error(`No prices updated (${noData} no-match, ${errors} errors)`);
    return result;
  } finally {
    await store.disconnect?.();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run().catch((error) => {
    console.error('[bg-fetch] Fatal error:', error.message || error);
    process.exitCode = 1;
  });
}
