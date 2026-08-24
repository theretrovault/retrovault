/** RetroVault Reddit deal matcher using public Atom RSS. */
import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';
import { fileURLToPath } from 'url';
import { createScraperStore } from './lib/scraper-store.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = process.env.RETROVAULT_DATA_DIR || path.join(ROOT, 'data');
const ALERTS_FILE = path.join(DATA_DIR, 'reddit-alerts.json');
const SUBREDDITS = (process.env.REDDIT_SUBREDDITS || 'gameswap').split(',').map((value) => value.trim()).filter(Boolean);
const HEADERS = { 'User-Agent': 'RetroVault/2.1 (+local collection manager)', Accept: 'application/atom+xml,application/xml;q=0.9' };
function readJson(file, fallback) { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; } }
function tokens(value) { return String(value || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((token) => token.length > 2); }

export function matchesItem(postTitle, postBody, itemTitle) {
  const text = `${postTitle} ${postBody}`.toLowerCase();
  const wanted = tokens(itemTitle);
  return wanted.length > 0 && wanted.filter((token) => text.includes(token)).length / wanted.length >= 0.7;
}

export function parseRedditRss(xml, subreddit) {
  const $ = cheerio.load(xml, { xmlMode: true });
  return $('entry').map((_, entry) => {
    const node = $(entry);
    const rawId = node.children('id').first().text().trim();
    const id = rawId.replace(/^t3_/, '').split('/').filter(Boolean).at(-1);
    if (!id) return null;
    return {
      id,
      title: node.children('title').first().text().trim(),
      body: node.children('content').first().text().slice(0, 2000),
      url: node.children('link').first().attr('href') || `https://www.reddit.com/r/${subreddit}`,
      author: node.find('author > name').first().text().trim(),
      subreddit,
      createdAt: node.children('updated').first().text().trim(),
      flair: '',
    };
  }).get().filter(Boolean);
}

export async function scrapeSubreddit(subreddit, { fetchImpl = fetch } = {}) {
  const url = `https://www.reddit.com/r/${subreddit}/new.rss?limit=50`;
  const response = await fetchImpl(url, { headers: HEADERS, signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw new Error(`Reddit RSS HTTP ${response.status} for r/${subreddit}`);
  const xml = await response.text();
  if (!/<feed\b/i.test(xml)) throw new Error(`Reddit returned a non-Atom response for r/${subreddit}`);
  return parseRedditRss(xml, subreddit);
}

export async function run({ store = createScraperStore(), fetchImpl = fetch, subreddits = SUBREDDITS } = {}) {
  try {
    const targets = await store.listDealTargets();
    if (!targets.length) { console.log('[reddit] No canonical watchlist or grail targets; nothing to match'); return { posts: 0, alerts: 0 }; }
    const posts = [];
    for (const subreddit of subreddits) posts.push(...await scrapeSubreddit(subreddit, { fetchImpl }));
    const previous = readJson(ALERTS_FILE, []);
    const previousById = new Map(previous.map((alert) => [alert.id, alert]));
    const alerts = [];
    for (const post of posts) {
      for (const target of targets) {
        if (!matchesItem(post.title, post.body, target.title)) continue;
        const id = `reddit-${post.id}-${target.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
        alerts.push({ id, postId: post.id, targetTitle: target.title, targetPlatform: target.platform, targetSource: target.source, postTitle: post.title, postUrl: post.url, author: post.author, subreddit: post.subreddit, createdAt: post.createdAt, scrapedAt: new Date().toISOString(), dismissed: previousById.get(id)?.dismissed || false });
        break;
      }
    }
    const current = new Set(alerts.map((alert) => alert.id));
    const merged = [...alerts, ...previous.filter((alert) => !current.has(alert.id))].slice(0, 200);
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const temp = `${ALERTS_FILE}.tmp-${process.pid}`;
    fs.writeFileSync(temp, JSON.stringify(merged, null, 2));
    fs.renameSync(temp, ALERTS_FILE);
    console.log(`[reddit] ${posts.length} RSS posts, ${alerts.length} matches, ${targets.length} canonical targets`);
    return { posts: posts.length, alerts: alerts.length };
  } finally { await store.disconnect?.(); }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run().catch((error) => { console.error('[reddit] Fatal:', error.message || error); process.exitCode = 1; });
}
