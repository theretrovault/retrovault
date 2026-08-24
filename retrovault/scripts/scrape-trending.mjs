/** RetroVault PriceCharting trending snapshot. */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { fetchGameRows } from './lib/pricecharting-list.mjs';

const DATA_DIR = process.env.RETROVAULT_DATA_DIR || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'data');
const OUTPUT = path.join(DATA_DIR, 'trending.json');
const HEADERS = { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124 Safari/537.36', Accept: 'text/html,*/*;q=0.8' };
const DELAY_MS = Number.parseInt(process.env.TRENDING_DELAY_MS || '2500', 10);
const PLATFORMS = [['NES','nes'],['SNES','super-nintendo'],['Nintendo 64','nintendo-64'],['Sega Genesis','sega-genesis'],['PS1','playstation'],['PS2','playstation-2'],['Dreamcast','sega-dreamcast']];
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function run({ fetchImpl = fetch, platforms = PLATFORMS } = {}) {
  const items = [];
  const errors = [];
  for (let index = 0; index < platforms.length; index += 1) {
    const [platform, slug] = platforms[index];
    try {
      const rows = await fetchGameRows(slug, { sort: 'sold', status: 'sold' }, { fetchImpl, headers: HEADERS });
      items.push(...rows.slice(0, 25).map((row) => ({ title: row.title, platform, price: row.loose })));
      console.log(`[trending] ${platform}: ${Math.min(rows.length, 25)} items`);
    } catch (error) {
      errors.push(`${platform}: ${error.message}`);
      console.error(`[trending] ${errors.at(-1)}`);
    }
    if (index + 1 < platforms.length && DELAY_MS > 0) await sleep(DELAY_MS);
  }
  if (!items.length || errors.length) throw new Error(`Trending incomplete: ${errors.join('; ') || 'zero rows'}`);
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const temp = `${OUTPUT}.tmp-${process.pid}`;
  fs.writeFileSync(temp, JSON.stringify({ scrapedAt: new Date().toISOString(), items }, null, 2));
  fs.renameSync(temp, OUTPUT);
  console.log(`[trending] Saved ${items.length} items`);
  return { items: items.length };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run().catch((error) => { console.error('[trending] Fatal:', error.message || error); process.exitCode = 1; });
}
