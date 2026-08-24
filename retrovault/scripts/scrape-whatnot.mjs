/** RetroVault Whatnot watcher with canonical Prisma persistence and honest blocked behavior. */
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';
import { createScraperStore } from './lib/scraper-store.mjs';

const HEADERS = { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124 Safari/537.36', Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8' };
const DELAY_MS = Number.parseInt(process.env.WHATNOT_DELAY_MS || '3000', 10);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const streamId = (seller, url, startTime, title) => `wn-${crypto.createHash('sha256').update(`${seller}|${url}|${startTime || ''}|${title}`).digest('hex').slice(0, 20)}`;

export function parseWhatnotProfile(html, seller) {
  const streams = [];
  const $ = cheerio.load(html);
  $('script[type="application/ld+json"]').each((_, node) => {
    try {
      const values = JSON.parse($(node).text());
      for (const entry of (Array.isArray(values) ? values : [values])) {
        if (entry?.['@type'] !== 'Event' && !entry?.startDate) continue;
        const title = String(entry.name || `${seller} live stream`).trim();
        const url = String(entry.url || `https://www.whatnot.com/user/${seller}`);
        const startTime = entry.startDate || null;
        streams.push({ id: streamId(seller, url, startTime, title), seller, title, startTime, scheduledText: null, url, source: 'whatnot-jsonld' });
      }
    } catch { /* ignore malformed unrelated JSON-LD blocks */ }
  });
  return streams;
}

export async function checkSeller(seller, { fetchImpl = fetch } = {}) {
  const url = `https://www.whatnot.com/user/${encodeURIComponent(seller.username)}`;
  const response = await fetchImpl(url, { headers: HEADERS, signal: AbortSignal.timeout(20_000) });
  if (response.status === 403 || response.status === 429) throw new Error(`Whatnot blocked automated access with HTTP ${response.status} for ${seller.username}`);
  if (!response.ok) throw new Error(`Whatnot HTTP ${response.status} for ${seller.username}`);
  const html = await response.text();
  if (/Just a moment|cf-challenge|challenge-platform/i.test(html)) throw new Error(`Whatnot returned a Cloudflare challenge for ${seller.username}`);
  if (!/<html|<!doctype/i.test(html)) throw new Error(`Whatnot returned unrecognized markup for ${seller.username}`);
  return parseWhatnotProfile(html, seller.username);
}

export async function run({ store = createScraperStore(), fetchImpl = fetch } = {}) {
  try {
    const sellers = await store.listWhatnotSellers();
    if (!sellers.length) {
      console.log('[whatnot] No canonical sellers configured; automated discovery skipped');
      return { sellers: 0, streams: 0 };
    }
    const streams = [];
    const errors = [];
    for (let index = 0; index < sellers.length; index += 1) {
      const seller = sellers[index];
      try {
        const found = await checkSeller(seller, { fetchImpl });
        streams.push(...found);
        console.log(`[whatnot] ${seller.username}: ${found.length} streams`);
      } catch (error) {
        errors.push(error.message || String(error));
        console.error(`[whatnot] ${errors.at(-1)}`);
      }
      if (index + 1 < sellers.length && DELAY_MS > 0) await sleep(DELAY_MS);
    }
    if (errors.length) throw new Error(`Whatnot discovery unavailable; canonical streams preserved. ${errors.join('; ')}`);
    await store.reconcileAutomatedWhatnotStreams(streams);
    return { sellers: sellers.length, streams: streams.length };
  } finally {
    await store.disconnect?.();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run().catch((error) => { console.error('[whatnot] Fatal:', error.message || error); process.exitCode = 1; });
}
