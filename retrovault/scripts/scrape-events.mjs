/** RetroVault Eventbrite scraper with stable IDs and canonical Prisma persistence. */
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import { createScraperStore } from './lib/scraper-store.mjs';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
};
const DELAY_MS = Number.parseInt(process.env.EVENT_SCRAPER_DELAY_MS || '3000', 10);
const DEFAULT_QUERIES = ['retro-gaming', 'video-game-expo', 'game-swap', 'gaming-convention', 'retro-games'];
const RELEVANT = /\b(retro\s*(?:video\s*)?(?:games?|gaming)|video\s*games?|game\s*(?:swap|expo|convention|tournament)|gaming\s*(?:expo|convention|tournament)|nintendo|sega|playstation|xbox|pinball|streetpass)\b/i;
const PRICE = /^(?:from\s+)?\$\s*[\d,.]+/i;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function isRelevantEvent(event) {
  const text = `${event.title || ''} ${event.description || ''}`;
  const tabletopOnly = /\b(tabletop|board\s*games?|role[ -]?playing|rpgs?|trading card)\b/i.test(text)
    && !/\b(retro\s*(?:video\s*)?(?:games?|gaming)|video\s*games?|playstation|nintendo|sega|xbox|atari|game\s*boy|dreamcast|streetpass)\b/i.test(text);
  return !tabletopOnly && RELEVANT.test(text);
}

export function stableEventId(event) {
  const key = [event.source || 'eventbrite', event.url || '', event.title || '', event.dateRaw || event.date || '', event.location || '']
    .join('|').toLowerCase().replace(/\s+/g, ' ').trim();
  return `eb-${crypto.createHash('sha256').update(key).digest('hex').slice(0, 16)}`;
}

function normalizeEvent(event) {
  const normalized = {
    ...event,
    source: 'eventbrite',
    location: PRICE.test(event.location || '') ? '' : (event.location || ''),
    venue: PRICE.test(event.venue || '') ? '' : (event.venue || ''),
    scrapedAt: new Date().toISOString(),
  };
  normalized.id = stableEventId(normalized);
  return normalized;
}

export function parseEventbriteText(text, url) {
  const events = [];
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
  const datePattern = /^((?:Mon|Tue|Wed|Thu|Fri|Sat|Sun|Today|Tomorrow|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)[,\s].+?\d{1,2}:\d{2}\s*(?:AM|PM))/i;
  const locationPattern = /^(.+?)\s*·\s*(.+)$/;

  for (let i = 0; i < lines.length;) {
    const title = lines[i];
    const dateRaw = lines[i + 1] || '';
    const detail = lines[i + 2] || '';
    if (!datePattern.test(dateRaw)) { i += 1; continue; }
    let location = '';
    let venue = '';
    if (!PRICE.test(detail)) {
      const match = detail.match(locationPattern);
      if (match) [location, venue] = [match[1], match[2]];
      else if (detail && !datePattern.test(detail)) location = detail;
    }
    const event = normalizeEvent({ title, dateRaw, location, venue, url, description: '' });
    if (isRelevantEvent(event)) events.push(event);
    i += detail ? 3 : 2;
  }
  return dedupeEvents(events);
}

function eventFromJsonLd(event, fallbackUrl) {
  const location = event.location?.address?.addressLocality || event.location?.name || '';
  const normalized = normalizeEvent({
    title: event.name || 'Unknown Event',
    dateRaw: event.startDate || '',
    date: event.startDate ? event.startDate.split('T')[0] : null,
    location,
    venue: event.location?.name || '',
    url: event.url || fallbackUrl,
    description: typeof event.description === 'string' ? event.description.slice(0, 500) : '',
  });
  return isRelevantEvent(normalized) ? normalized : null;
}

function collectJsonLd(value, fallbackUrl, output) {
  if (Array.isArray(value)) return value.forEach((item) => collectJsonLd(item, fallbackUrl, output));
  if (!value || typeof value !== 'object') return;
  if (value['@type'] === 'Event') {
    const event = eventFromJsonLd(value, fallbackUrl);
    if (event) output.push(event);
  }
  for (const key of ['@graph', 'itemListElement', 'item']) {
    if (value[key]) collectJsonLd(value[key], fallbackUrl, output);
  }
}

export function parseEventbriteHtml(html, url) {
  const events = [];
  for (const match of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { collectJsonLd(JSON.parse(match[1]), url, events); } catch { /* ignore malformed embedded JSON */ }
  }
  if (events.length) return dedupeEvents(events);
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '\n')
    .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n');
  return parseEventbriteText(text, url);
}

export function dedupeEvents(events) {
  const seen = new Set();
  return events.filter((event) => {
    if (seen.has(event.id)) return false;
    seen.add(event.id);
    return true;
  });
}

export async function scrapeEventbrite(query, { fetchImpl = fetch } = {}) {
  const url = `https://www.eventbrite.com/d/united-states/${encodeURIComponent(query)}/`;
  const response = await fetchImpl(url, { headers: HEADERS, signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw new Error(`Eventbrite HTTP ${response.status} for ${query}`);
  return parseEventbriteHtml(await response.text(), url);
}

export async function run({ store = createScraperStore(), fetchImpl = fetch, queries = DEFAULT_QUERIES } = {}) {
  try {
    const all = [];
    const errors = [];
    for (let i = 0; i < queries.length; i += 1) {
      try {
        const events = await scrapeEventbrite(queries[i], { fetchImpl });
        console.log(`[events] ${queries[i]}: ${events.length} relevant events`);
        all.push(...events);
      } catch (error) {
        errors.push(error.message);
        console.error(`[events] ${error.message}`);
      }
      if (i + 1 < queries.length && DELAY_MS > 0) await sleep(DELAY_MS);
    }
    const events = dedupeEvents(all);
    if (!events.length) throw new Error(`No relevant events parsed; upstream errors: ${errors.join('; ') || 'none'}`);
    if (errors.length) throw new Error(`Eventbrite incomplete: ${errors.join('; ')}`);
    await store.upsertScrapedEvents(events);
    console.log(`[events] Upserted ${events.length} canonical events`);
    return { events: events.length, errors };
  } finally {
    await store.disconnect?.();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run().catch((error) => { console.error('[events] Fatal:', error.message || error); process.exitCode = 1; });
}
