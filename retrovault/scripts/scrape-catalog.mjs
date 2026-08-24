/** RetroVault PriceCharting catalog updater backed by canonical Prisma storage. */
import path from 'path';
import { fileURLToPath } from 'url';
import { createScraperStore } from './lib/scraper-store.mjs';
import { fetchGameRows, selectPlatforms } from './lib/pricecharting-list.mjs';

const HEADERS = { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124 Safari/537.36', Accept: 'text/html,*/*;q=0.8' };
const DELAY_MS = Number.parseInt(process.env.CATALOG_DELAY_MS || '2500', 10);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const PLATFORMS = [
  ['NES','nes'],['SNES','super-nintendo'],['Nintendo 64','nintendo-64'],['Gamecube','gamecube'],['Wii','wii'],['Wii U','wii-u'],['Switch','nintendo-switch'],['Switch 2','nintendo-switch-2'],
  ['Game Boy','gameboy'],['Game Boy Color','gameboy-color'],['Game Boy Advance','gameboy-advance'],['Nintendo DS','nintendo-ds'],['Nintendo 3DS','nintendo-3ds'],
  ['PS1','playstation'],['PS2','playstation-2'],['PS3','playstation-3'],['PS4','playstation-4'],['PS5','playstation-5'],['PSP','psp'],['PS Vita','playstation-vita'],
  ['Sega Genesis','sega-genesis'],['Sega CD','sega-cd'],['Sega 32X','sega-32x'],['Sega Saturn','sega-saturn'],['Dreamcast','sega-dreamcast'],['Game Gear','sega-game-gear'],['Sega Master System','sega-master-system'],
  ['Xbox','xbox'],['Xbox 360','xbox-360'],['Xbox One','xbox-one'],['Xbox Series X','xbox-series-x'],['Atari 2600','atari-2600'],['TurboGrafx-16','turbografx-16'],['Neo Geo','neo-geo-aes'],['Atari Jaguar','atari-jaguar'],
].map(([name, slug]) => ({ name, slug }));

export function makeGameId(title, platform) {
  return `${platform}-${title}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function requestedPlatforms(argv = process.argv.slice(2)) {
  const arg = argv.find((value) => value.startsWith('--platforms='));
  return arg ? arg.slice('--platforms='.length).split(',').map((value) => value.trim()).filter(Boolean) : null;
}

export async function run({ store = createScraperStore(), fetchImpl = fetch, platforms = selectPlatforms(PLATFORMS, requestedPlatforms()) } = {}) {
  try {
    if (!platforms.length) throw new Error('No exact platform names or slugs matched --platforms');
    let added = 0;
    let existing = 0;
    const errors = [];
    for (let index = 0; index < platforms.length; index += 1) {
      const platform = platforms[index];
      try {
        const rows = await fetchGameRows(platform.slug, { sort: 'title' }, { fetchImpl, headers: HEADERS });
        const result = await store.upsertCatalogGames(rows.map((row) => ({ id: makeGameId(row.title, platform.name), title: row.title, platform: platform.name })));
        added += result.added;
        existing += result.existing;
        console.log(`[catalog] ${platform.name}: ${rows.length} rows, ${result.added} added, ${result.existing} existing`);
      } catch (error) {
        errors.push(`${platform.name}: ${error.message}`);
        console.error(`[catalog] ${errors.at(-1)}`);
      }
      if (index + 1 < platforms.length && DELAY_MS > 0) await sleep(DELAY_MS);
    }
    if (added + existing === 0 || errors.length) throw new Error(`Catalog incomplete: ${errors.join('; ') || 'zero rows'}`);
    return { added, existing };
  } finally {
    await store.disconnect?.();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run().catch((error) => { console.error('[catalog] Fatal:', error.message || error); process.exitCode = 1; });
}
