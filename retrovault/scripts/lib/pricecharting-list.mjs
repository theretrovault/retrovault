import * as cheerio from 'cheerio';

export function buildConsoleUrl(slug, params = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') query.set(key, String(value));
  }
  return `https://www.pricecharting.com/console/${encodeURIComponent(slug)}${query.size ? `?${query}` : ''}`;
}

function money(value) {
  const parsed = Number.parseFloat(String(value || '').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseGameRows(html) {
  const $ = cheerio.load(html);
  return $('#games_table tbody tr').map((_, row) => {
    const link = $(row).find('td.title a[href^="/game/"]').first();
    const prices = $(row).find('.js-price').map((__, el) => money($(el).text())).get();
    const title = link.text().trim();
    if (!title) return null;
    return { title, href: link.attr('href') || null, loose: prices[0] ?? null, cib: prices[1] ?? null, new: prices[2] ?? null };
  }).get().filter(Boolean);
}

export function selectPlatforms(platforms, requested) {
  if (!requested?.length) return platforms;
  const wanted = new Set(requested.map((value) => value.trim().toLowerCase()));
  return platforms.filter((platform) => wanted.has(platform.name.toLowerCase()) || wanted.has(platform.slug.toLowerCase()));
}

export async function fetchGameRows(slug, params, { fetchImpl = fetch, headers = {} } = {}) {
  const url = buildConsoleUrl(slug, params);
  const response = await fetchImpl(url, { headers, signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw new Error(`PriceCharting HTTP ${response.status} for ${slug}`);
  const rows = parseGameRows(await response.text());
  if (!rows.length) throw new Error(`PriceCharting returned zero parseable rows for ${slug}`);
  return rows;
}
