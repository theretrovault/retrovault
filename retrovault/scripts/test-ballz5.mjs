import { load } from 'cheerio';

const url = 'https://www.pricecharting.com/game/sega-genesis/ballz-3d';
const res = await fetch(url, {headers: {'User-Agent': 'Mozilla/5.0'}});
const html = await res.text();
const $ = load(html);

// Look at rows with id matching price patterns
$('[id*="price"], [id*="Price"]').each((i, el) => {
  const id = $(el).attr('id');
  const text = $(el).text().replace(/\s+/g, ' ').trim().slice(0, 60);
  console.log(`#${id}:`, text);
});

// Look at the main pricing table structure
console.log('\n--- All table rows with prices ---');
$('table tr, #game_details tr, .prices tr').each((i, row) => {
  const text = $(row).text().replace(/\s+/g,' ').trim().slice(0,100);
  if (text.includes('$')) console.log('row:', text);
});
