import { describe, expect, it, vi } from 'vitest';
import path from 'path';
import { pathToFileURL } from 'url';

const scriptUrl = (name: string) => pathToFileURL(path.join(process.cwd(), 'scripts', name)).href;

describe('Eventbrite parser', () => {
  it('keeps relevant gaming events, rejects promoted noise, and never treats prices as locations', async () => {
    const { parseEventbriteText } = await import(scriptUrl('scrape-events.mjs'));
    const text = `Voice Over Workshop
Sat, Sep 12, 10:00 AM
From $25.09
Retro Video Game Swap Meet
Sun, Sep 13, 11:00 AM
Kalamazoo · Expo Center
`;
    const events = parseEventbriteText(text, 'https://eventbrite.test/search');
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ title: 'Retro Video Game Swap Meet', location: 'Kalamazoo', venue: 'Expo Center' });
    expect(events[0].id).toMatch(/^eb-[a-f0-9]{16}$/);
  });

  it('rejects tabletop-only conventions while retaining explicit video-game events', async () => {
    const { isRelevantEvent } = await import(scriptUrl('scrape-events.mjs'));
    expect(isRelevantEvent({ title: 'Free Tabletop Gaming Convention', description: 'Board games and RPGs' })).toBe(false);
    expect(isRelevantEvent({ title: 'Trading Card Show & Video Game Tournament', description: '' })).toBe(true);
  });

  it('uses stable IDs for the same source event', async () => {
    const { parseEventbriteText } = await import(scriptUrl('scrape-events.mjs'));
    const text = `Retro Game Expo
Sun, Sep 13, 11:00 AM
Detroit · Convention Center
`;
    const first = parseEventbriteText(text, 'https://eventbrite.test/search');
    const second = parseEventbriteText(text, 'https://eventbrite.test/search');
    expect(first[0].id).toBe(second[0].id);
  });
});


describe('Craigslist parser', () => {
  it('parses current cl-static-search-result markup with stable IDs', async () => {
    const { parseCraigslistHtml } = await import(scriptUrl('scrape-craigslist.mjs'));
    const html = `<ol><li class="cl-static-search-result"><a href="https://www.craigslist.org/view/d/allegan-used-xbox-games/abc123"><div class="title">Used Xbox 360 games</div><div class="details"><div class="price">$10</div><div class="location">Allegan</div></div></a></li></ol>`;
    const first = parseCraigslistHtml(html, 'kalamazoo');
    const second = parseCraigslistHtml(html, 'kalamazoo');
    expect(first.recognized).toBe(true);
    expect(first.listings[0]).toMatchObject({ title: 'Used Xbox 360 games', price: 10, location: 'Allegan' });
    expect(first.listings[0].id).toBe(second.listings[0].id);
  });
});


describe('Reddit RSS parser', () => {
  it('parses public Atom entries without the blocked JSON endpoint', async () => {
    const { parseRedditRss } = await import(scriptUrl('scrape-reddit.mjs'));
    const xml = `<?xml version="1.0"?><feed><entry><id>t3_abc</id><title>[USA-MI] [H] Chrono Trigger SNES [W] PayPal</title><updated>2026-08-24T12:00:00Z</updated><author><name>seller</name></author><link href="https://www.reddit.com/r/gameswap/comments/abc"/><content type="html">Great condition</content></entry></feed>`;
    expect(parseRedditRss(xml, 'gameswap')[0]).toMatchObject({ id: 'abc', author: 'seller', subreddit: 'gameswap' });
  });
});



describe('Whatnot parser and blocked behavior', () => {
  it('creates stable IDs from structured event data', async () => {
    const { parseWhatnotProfile } = await import(scriptUrl('scrape-whatnot.mjs'));
    const html = `<html><script type="application/ld+json">{"@type":"Event","name":"Retro Night","startDate":"2026-09-01T20:00:00Z","url":"https://www.whatnot.com/live/abc"}</script></html>`;
    const first = parseWhatnotProfile(html, 'seller');
    const second = parseWhatnotProfile(html, 'seller');
    expect(first[0]).toMatchObject({ seller: 'seller', title: 'Retro Night', source: 'whatnot-jsonld' });
    expect(first[0].id).toBe(second[0].id);
  });

  it('fails visibly and preserves canonical streams when Cloudflare blocks discovery', async () => {
    const { run } = await import(scriptUrl('scrape-whatnot.mjs'));
    const store = {
      listWhatnotSellers: async () => [{ username: 'seller' }],
      reconcileAutomatedWhatnotStreams: vi.fn(),
      disconnect: vi.fn(),
    };
    const fetchImpl = async () => new Response('blocked', { status: 403 });
    await expect(run({ store, fetchImpl })).rejects.toThrow('canonical streams preserved');
    expect(store.reconcileAutomatedWhatnotStreams).not.toHaveBeenCalled();
    expect(store.disconnect).toHaveBeenCalled();
  });
});

describe('upstream failure semantics', () => {
  const response = (status: number, body = '') => ({ ok: status >= 200 && status < 300, status, text: async () => body, url: 'https://fixture.invalid' }) as Response;

  it('rejects obsolete PriceCharting URLs instead of returning an empty success', async () => {
    const { fetchGameRows } = await import(pathToFileURL(path.join(process.cwd(), 'scripts/lib/pricecharting-list.mjs')).href);
    await expect(fetchGameRows('nes', {}, { fetchImpl: async () => response(404) })).rejects.toThrow('HTTP 404');
  });

  it('rejects unrecognized Craigslist markup drift', async () => {
    const { scrapeCity } = await import(scriptUrl('scrape-craigslist.mjs'));
    await expect(scrapeCity('kalamazoo', { fetchImpl: async () => response(200, '<html>challenge</html>') })).rejects.toThrow('recognized result markup');
  });

  it('surfaces Reddit rate limits as job errors', async () => {
    const { scrapeSubreddit } = await import(scriptUrl('scrape-reddit.mjs'));
    await expect(scrapeSubreddit('gameswap', { fetchImpl: async () => response(429) })).rejects.toThrow('HTTP 429');
  });
});
