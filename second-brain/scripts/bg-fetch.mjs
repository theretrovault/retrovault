import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataPath = path.join(__dirname, '..', 'data', 'inventory.json');
const lockPath = path.join(__dirname, '..', 'data', 'fetch.lock');

function isLocked() {
  return fs.existsSync(lockPath);
}

async function waitForUnlock(label) {
  if (!isLocked()) return;
  console.log(`[bg-fetch] UI lock detected on ${label}, pausing...`);
  while (isLocked()) {
    await new Promise(r => setTimeout(r, 5000)); // check every 5s
  }
  console.log(`[bg-fetch] Lock released, resuming...`);
}

async function getPrice(query) {
  const url = `https://www.pricecharting.com/search-products?q=${encodeURIComponent(query)}&type=videogames`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    }
  });
  const html = await res.text();
  const $ = cheerio.load(html);

  let loose = 'N/A', cib = 'N/A', newPrice = 'N/A', graded = 'N/A';

  const firstRow = $('table#games_table tbody tr').first();
  if (firstRow.length > 0) {
    loose = firstRow.find('td.used_price .js-price, td.used_price').text().trim().split('\n')[0] || 'N/A';
    cib = firstRow.find('td.cib_price .js-price, td.cib_price').text().trim().split('\n')[0] || 'N/A';
    newPrice = firstRow.find('td.new_price .js-price, td.new_price').text().trim().split('\n')[0] || 'N/A';
    graded = firstRow.find('td.graded_price .js-price, td.graded_price').text().trim().split('\n')[0] || 'N/A';
  }

  return {
    loose: loose.replace('$', '').trim(),
    cib: cib.replace('$', '').trim(),
    new: newPrice.replace('$', '').trim(),
    graded: graded.replace('$', '').trim()
  };
}

async function run() {
  let inventory = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const today = new Date().toISOString().split('T')[0];

  // Skip items already fetched TODAY (so daily re-runs don't duplicate)
  const toFetch = inventory.filter(item => {
    const history = item.priceHistory || {};
    return !history[today]; // hasn't been fetched today yet
  });

  console.log(`[bg-fetch] ${new Date().toISOString()}`);
  console.log(`[bg-fetch] Total items: ${inventory.length} | To fetch today: ${toFetch.length}`);

  let updated = 0;
  let failed = 0;
  let saveInterval = 0;

  for (let i = 0; i < toFetch.length; i++) {
    const item = toFetch[i];
    const progress = `[${i + 1}/${toFetch.length}]`;

    try {
      const q = `${item.title} ${item.platform}`;
      const data = await getPrice(q);

      if (data.loose !== 'N/A' || data.cib !== 'N/A') {
        // Find and update this item in the full inventory array
        const idx = inventory.findIndex(x => x.id === item.id);
        if (idx !== -1) {
          const existing = inventory[idx];
          const newHistory = {
            ...(existing.priceHistory || {}),
            [today]: {
              loose: data.loose !== 'N/A' ? data.loose : null,
              cib: data.cib !== 'N/A' ? data.cib : null,
              new: data.new !== 'N/A' ? data.new : null,
              graded: data.graded !== 'N/A' ? data.graded : null,
              fetchedAt: new Date().toISOString()
            }
          };

          inventory[idx] = {
            ...existing,
            marketLoose: data.loose !== 'N/A' ? data.loose : existing.marketLoose,
            marketCib: data.cib !== 'N/A' ? data.cib : existing.marketCib,
            marketNew: data.new !== 'N/A' ? data.new : existing.marketNew,
            marketGraded: data.graded !== 'N/A' ? data.graded : existing.marketGraded,
            lastFetched: new Date().toISOString(),
            priceHistory: newHistory
          };
          updated++;
          console.log(`${progress} ✓ ${item.title} (${item.platform}): L=$${data.loose} CIB=$${data.cib}`);
        }
      } else {
        failed++;
        console.log(`${progress} ~ No data: ${item.title}`);
        // Still mark it as attempted so we don't retry until tomorrow
        const idx = inventory.findIndex(x => x.id === item.id);
        if (idx !== -1) {
          const existing = inventory[idx];
          inventory[idx] = {
            ...existing,
            lastFetched: new Date().toISOString(),
            priceHistory: {
              ...(existing.priceHistory || {}),
              [today]: { loose: null, cib: null, new: null, graded: null, fetchedAt: new Date().toISOString() }
            }
          };
        }
      }

      // Save every 25 fetches to avoid losing progress if interrupted
      saveInterval++;
      if (saveInterval >= 25) {
        fs.writeFileSync(dataPath, JSON.stringify(inventory, null, 2));
        saveInterval = 0;
      }

    } catch (e) {
      failed++;
      console.error(`${progress} ✗ Error on ${item.title}:`, e.message);
    }

    // 2.5 second delay + pause if UI is fetching
    await new Promise(r => setTimeout(r, 2500));
    await waitForUnlock(item.title);
  }

  // Final save
  fs.writeFileSync(dataPath, JSON.stringify(inventory, null, 2));
  console.log(`[bg-fetch] Complete. Updated: ${updated} | No data: ${failed} | ${new Date().toISOString()}`);
}

run().catch(e => {
  console.error('[bg-fetch] Fatal error:', e);
  process.exit(1);
});
