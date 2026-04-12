import { load } from 'cheerio';

const url = 'https://www.pricecharting.com/search-products?q=Ballz+3D+Sega+Genesis&type=videogames';
const res = await fetch(url, {headers: {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}});
const html = await res.text();
const $ = load(html);

console.log('Page title:', $('title').text().trim());
console.log('---');

$('table#games_table tbody tr').slice(0, 5).each((i, row) => {
  const title = $(row).find('td.title').text().replace(/\s+/g, ' ').trim().slice(0, 100);
  const loose = $(row).find('td.used_price').text().replace(/\s+/g, ' ').trim().slice(0, 20);
  console.log(`Row ${i+1}:`, title, '| loose:', loose);
});
