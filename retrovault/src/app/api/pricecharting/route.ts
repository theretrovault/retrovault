import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

// Normalized title for comparison: lowercase, remove punctuation and common noise words
function normalizeTitle(s: string): string {
  return s.toLowerCase()
    .replace(/[''`]/g, "'")          // normalize apostrophes
    .replace(/[^a-z0-9 ']/g, ' ')    // keep only alphanum, spaces, apostrophes
    .replace(/\b(the|a|an|and|of|n)\b/g, '') // strip common articles
    .replace(/\s+/g, ' ').trim();
}

// Token overlap score: what fraction of query tokens appear in result title?
function tokenScore(query: string, candidate: string): number {
  const qTokens = normalizeTitle(query).split(' ').filter(Boolean);
  const cNorm = normalizeTitle(candidate);
  if (qTokens.length === 0) return 0;
  const matches = qTokens.filter(t => t.length > 1 && cNorm.includes(t)).length;
  return matches / qTokens.length;
}

// Exact suffix penalty: if result title ends with a number/word the query doesn't have, penalize
function hasSuspiciousSuffix(query: string, candidate: string): boolean {
  const qNorm = normalizeTitle(query);
  const cNorm = normalizeTitle(candidate);
  // Check if candidate has trailing tokens not in query (like '2', 'ii', 'deluxe', 'plus')
  const qTokens = new Set(qNorm.split(' ').filter(Boolean));
  const cTokens = cNorm.split(' ').filter(Boolean);
  const extraTokens = cTokens.filter(t => !qTokens.has(t));
  // If extra tokens look like sequel indicators, flag it
  return extraTokens.some(t => /^(2|3|4|5|ii|iii|iv|v|vi|deluxe|plus|ex|super|special|turbo|remix|ultra)$/i.test(t));
}

// Map platform names to PriceCharting console slugs
const PLATFORM_SLUGS: Record<string, string> = {
  'sega genesis': 'sega-genesis',
  'nes': 'nes',
  'snes': 'super-nintendo',
  'super nintendo entertainment system': 'super-nintendo',
  'n64': 'n64',
  'nintendo 64': 'n64',
  'gamecube': 'gamecube',
  'nintendo gamecube': 'gamecube',
  'nintendo switch': 'switch',
  'playstation 1': 'playstation',
  'playstation 2': 'playstation-2',
  'playstation 3': 'playstation-3',
  'sony psp': 'psp',
  'xbox': 'xbox',
  'xbox 360': 'xbox-360',
  'sega cd': 'sega-cd',
  'sega dreamcast': 'dreamcast',
};

function titleToSlug(s: string): string {
  return s.toLowerCase()
    .replace(/[''`]/g, '')
    .replace(/[^a-z0-9 -]/g, ' ')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  
  if (!q) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  const queryTitle = q;

  try {
    // Strategy 1: Try direct URL first (most accurate)
    // q format is usually "Game Title Platform Name"
    // Try to extract platform from end of query
    let directResult = null;
    for (const [platName, platSlug] of Object.entries(PLATFORM_SLUGS)) {
      if (q.toLowerCase().endsWith(platName)) {
        const gameTitle = q.slice(0, q.length - platName.length - 1).trim();
        const gameSlug = titleToSlug(gameTitle);
        const directUrl = `https://www.pricecharting.com/game/${platSlug}/${gameSlug}`;
        
        const directRes = await fetch(directUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });
        const directHtml = await directRes.text();
        const $d = cheerio.load(directHtml);
        const pageTitle = $d('h1').first().text().trim();
        
        // Check it's actually a game page (not 404 redirect)
        if (pageTitle && !pageTitle.toLowerCase().includes('not found') && !pageTitle.toLowerCase().includes('search')) {
          // Try to find pricing from the related editions table on product page
          // Score each row by how well its title matches the game we searched for
          let loose = null, cib = null, newPrice = null, graded = null;
          let bestRowScore = -1;
          
          const platAliases = [platName, platSlug.replace(/-/g, ' '), 'mega drive', 'mega-drive',
                               platName.replace('playstation 1','playstation').replace('snes','super nintendo')];

          $d('table tr').each((_: any, row: any) => {
            const rowEl = $d(row);
            const rowText = rowEl.text().replace(/\s+/g, ' ').trim();
            const rowLower = rowText.toLowerCase();
            const isThisPlatform = platAliases.some((a: string) => rowLower.includes(a.toLowerCase()));
            if (!isThisPlatform) return;

            const prices = rowEl.find('.js-price').map((_: any, el: any) => $d(el).text().replace('$','').replace(',','').trim()).get().filter((p: string) => p && p !== '?' && !isNaN(parseFloat(p)));
            if (prices.length < 2) return;

            // Score this row: how well does the row title match our game title?
            // Find the link text or first cell text as the row's game title
            const rowTitleEl = rowEl.find('a').first();
            const rowTitle = rowTitleEl.text().replace(/\s+/g, ' ').trim() || rowText.slice(0, 50);
            const score = tokenScore(gameTitle, rowTitle) - (hasSuspiciousSuffix(gameTitle, rowTitle) ? 0.5 : 0);

            if (score > bestRowScore) {
              bestRowScore = score;
              [loose, cib, newPrice] = prices as [string, string, string];
              graded = prices[3] || null;
            }
          });
          
          // Fallback: try standard price IDs on the product page
          if (!loose) {
            loose = $d('#used_price .price').text().replace('$','').trim() || null;
            cib   = $d('#cib_price .price').text().replace('$','').trim() || null;
            newPrice = $d('#new_price .price').text().replace('$','').trim() || null;
          }
          
          if (loose || cib) {
            directResult = { loose: loose || 'N/A', cib: cib || 'N/A', new: newPrice || 'N/A', graded: graded || 'N/A', matchedTitle: pageTitle, confidence: 1.0 };
            break;
          }
        }
        break;
      }
    }
    
    if (directResult) {
      return NextResponse.json(directResult);
    }

    // Strategy 2: Fuzzy search fallback
    const searchUrl = `https://www.pricecharting.com/search-products?q=${encodeURIComponent(q)}&type=videogames`;
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      }
    });

    const html = await response.text();
    const $ = cheerio.load(html);

    // Check if we landed on a direct product page
    let loosePrice = $('#used_price .price').text().trim() || null;
    let cibPrice = $('#cib_price .price').text().trim() || null;
    let newPrice = $('#new_price .price').text().trim() || null;
    let gradedPrice = $('#graded_price .price').text().trim() || null;
    let matchedTitle = $('h1').first().text().trim();

    if (!loosePrice) {
      // Search results page — find the best-matching row
      const rows = $('table#games_table tbody tr').toArray();
      let bestScore = 0;
      let bestRow: any = null;
      let bestTitle = '';

      for (const row of rows) {
        const rowEl = $(row);
        const titleEl = rowEl.find('td.title a, td.title');
        const rowTitle = titleEl.text().trim();
        if (!rowTitle) continue;

        // Score this result
        const score = tokenScore(queryTitle, rowTitle);
        const suspicious = hasSuspiciousSuffix(queryTitle, rowTitle);
        const adjustedScore = suspicious ? score * 0.5 : score;

        if (adjustedScore > bestScore) {
          bestScore = adjustedScore;
          bestRow = rowEl;
          bestTitle = rowTitle;
        }
      }

      // Require at least 60% token overlap to trust the result
      if (bestRow && bestScore >= 0.6) {
        loosePrice = bestRow.find('td.used_price .js-price, td.used_price').text().trim().split('\n')[0] || null;
        cibPrice   = bestRow.find('td.cib_price .js-price, td.cib_price').text().trim().split('\n')[0] || null;
        newPrice   = bestRow.find('td.new_price .js-price, td.new_price').text().trim().split('\n')[0] || null;
        gradedPrice= bestRow.find('td.graded_price .js-price, td.graded_price').text().trim().split('\n')[0] || null;
        matchedTitle = bestTitle;
      } else {
        // No confident match found
        return NextResponse.json({
          loose: 'N/A', cib: 'N/A', new: 'N/A', graded: 'N/A',
          matchedTitle: null,
          confidence: bestScore
        });
      }
    }

    const clean = (s: string | null) => s ? s.replace('$', '').trim() : 'N/A';

    return NextResponse.json({
      loose: clean(loosePrice),
      cib: clean(cibPrice),
      new: clean(newPrice),
      graded: clean(gradedPrice),
      matchedTitle,
      confidence: 1.0
    });

  } catch (error: any) {
    console.error("PriceCharting Scrape Error:", error);
    return NextResponse.json({ error: "Failed to fetch price" }, { status: 500 });
  }
}
