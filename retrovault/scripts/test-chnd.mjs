import { load } from 'cheerio';

const url = 'https://www.pricecharting.com/game/nes/chip-n-dale-rescue-rangers';
const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
const html = await res.text();
const $ = load(html);

console.log('h1:', $('h1').first().text().trim());
console.log('js-price values:', $('.js-price').map((i, el) => $(el).text().trim()).get().slice(0, 6));

// Check table rows for NES platform
$('table tr').each((i, row) => {
  const text = $(row).text().replace(/\s+/g, ' ').trim();
  if (text.toLowerCase().includes('nes') && text.includes('$')) {
    console.log(`NES row ${i}:`, text.slice(0, 120));
  }
});
