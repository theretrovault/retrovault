/** RetroVault Craigslist deal matcher using current static result markup. */
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';
import { fileURLToPath } from 'url';
import { createScraperStore } from './lib/scraper-store.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = process.env.RETROVAULT_DATA_DIR || path.join(ROOT, 'data');
const DEALS_FILE = path.join(DATA_DIR, 'craigslist-deals.json');
const CONFIG_FILE = path.join(DATA_DIR, 'app.config.json');
const HEADERS = { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124 Safari/537.36', Accept: 'text/html,*/*;q=0.8' };

function readJson(file, fallback) { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; } }
function tokenize(value) { return String(value || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((token) => token.length > 2); }
function stableId(url) { return `cl-${crypto.createHash('sha256').update(url).digest('hex').slice(0, 16)}`; }

export function parseCraigslistHtml(html, citySlug) {
  const $ = cheerio.load(html);
  const nodes = $('.cl-static-search-result');
  const recognized = nodes.length > 0 || /class=["'](?:cl-search-results|no-results)/i.test(html);
  const listings = nodes.map((_, node) => {
    const link = $(node).find('a[href]').first();
    const url = link.attr('href');
    const title = $(node).find('.title').first().text().trim();
    const priceText = $(node).find('.price').first().text();
    const price = Number.parseFloat(priceText.replace(/[^0-9.]/g, ''));
    if (!url || !title) return null;
    return {
      id: stableId(url), title, price: Number.isFinite(price) ? price : null,
      location: $(node).find('.location').first().text().trim() || citySlug,
      url, citySlug, scrapedAt: new Date().toISOString(),
    };
  }).get().filter(Boolean);
  return { listings, recognized };
}

export function matchScore(listing, targets) {
  const listingTokens = tokenize(listing.title);
  let result = { score: 0, target: null };
  for (const target of targets) {
    const tokens = tokenize(target.title);
    if (!tokens.length) continue;
    const score = tokens.filter((token) => listingTokens.includes(token)).length / tokens.length;
    if (score > result.score) result = { score, target };
  }
  return result;
}

export async function scrapeCity(citySlug, { fetchImpl = fetch } = {}) {
  const url = `https://${citySlug}.craigslist.org/search/vga?sort=date&max_price=500`;
  const response = await fetchImpl(url, { headers: HEADERS, redirect: 'follow', signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw new Error(`Craigslist HTTP ${response.status} for ${citySlug}`);
  const parsed = parseCraigslistHtml(await response.text(), citySlug);
  if (!parsed.recognized) throw new Error('Craigslist response did not contain recognized result markup');
  return parsed.listings;
}

export async function run({ store = createScraperStore(), fetchImpl = fetch } = {}) {
  try {
    const config = readJson(CONFIG_FILE, {});
    const citySlug = process.env.CRAIGSLIST_CITY || config?.scrapers?.craigslistCity || 'kalamazoo';
    const [targets, listings] = await Promise.all([store.listDealTargets(), scrapeCity(citySlug, { fetchImpl })]);
    const previous = readJson(DEALS_FILE, []);
    const previousById = new Map(previous.map((deal) => [deal.id, deal]));
    const scored = listings.map((listing) => {
      const { score, target } = matchScore(listing, targets);
      const isWatchlistMatch = Boolean(target && score >= 0.6);
      const isRetroKeyword = /\b(nes|snes|n64|genesis|sega|atari|game\s?boy|dreamcast|ps1|ps2|psx|game\s?cube|super nintendo|nintendo 64|xbox 360)\b/i.test(listing.title);
      return { ...listing, matchScore: score, matchTarget: target?.title || null, matchSource: target?.source || null, alertPrice: target?.alertPrice || null, isWatchlistMatch, isRetroKeyword, isGoodDeal: isWatchlistMatch || isRetroKeyword, dismissed: previousById.get(listing.id)?.dismissed || false };
    }).filter((listing) => listing.isGoodDeal);
    const currentIds = new Set(scored.map((deal) => deal.id));
    const merged = [...scored, ...previous.filter((deal) => !currentIds.has(deal.id))].slice(0, 500);
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const temp = `${DEALS_FILE}.tmp-${process.pid}`;
    fs.writeFileSync(temp, JSON.stringify(merged, null, 2));
    fs.renameSync(temp, DEALS_FILE);
    console.log(`[craigslist] ${listings.length} listings, ${scored.length} relevant, ${targets.length} canonical targets`);
    return { listings: listings.length, relevant: scored.length };
  } finally { await store.disconnect?.(); }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run().catch((error) => { console.error('[craigslist] Fatal:', error.message || error); process.exitCode = 1; });
}
