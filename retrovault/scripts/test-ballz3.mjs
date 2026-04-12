import { load } from 'cheerio';

// Try direct URL construction: PriceCharting uses predictable URLs
// Format: /game/{console-slug}/{game-slug}
function toSlug(s) {
  return s.toLowerCase()
    .replace(/[''`]/g, '')
    .replace(/[^a-z0-9 -]/g, ' ')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

const platformSlugMap = {
  'sega genesis': 'sega-genesis',
  'nes': 'nes',
  'snes': 'super-nintendo',
  'n64': 'n64',
  'gamecube': 'gamecube',
  'nintendo switch': 'nintendo-switch',
  'playstation 1': 'playstation',
  'playstation 2': 'playstation-2',
  'playstation 3': 'playstation-3',
  'sony psp': 'psp',
  'xbox': 'xbox',
  'xbox 360': 'xbox-360',
  'sega cd': 'sega-cd',
  'sega dreamcast': 'sega-dreamcast',
};

const gameTitle = 'Ballz 3D';
const platform = 'Sega Genesis';
const platformSlug = platformSlugMap[platform.toLowerCase()] || toSlug(platform);
const gameSlug = toSlug(gameTitle);

const directUrl = `https://www.pricecharting.com/game/${platformSlug}/${gameSlug}`;
console.log('Trying direct URL:', directUrl);

const res = await fetch(directUrl, {headers: {'User-Agent': 'Mozilla/5.0'}});
const html = await res.text();
const $ = load(html);

const h1 = $('h1').first().text().trim();
const loose = $('#used_price .price').text().trim();
const cib = $('#cib_price .price').text().trim();
const newP = $('#new_price .price').text().trim();
console.log('Page title:', h1);
console.log('Loose:', loose, '| CIB:', cib, '| New:', newP);
