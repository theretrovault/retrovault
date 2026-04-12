import { load } from 'cheerio';

// The page title says "Ballz 3d Sega Genesis Prices" meaning PriceCharting redirected 
// to a LIST page for the "Ballz 3d" search — let's check if there's a direct URL available
const url = 'https://www.pricecharting.com/search-products?q=Ballz+3D+Sega+Genesis&type=videogames';
const res = await fetch(url, {headers: {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}});
const finalUrl = res.url;
console.log('Final URL:', finalUrl);

const html = await res.text();
const $ = load(html);

console.log('Final URL title:', $('h1').first().text().trim());

// Check all links in the table
$('table#games_table tbody tr').slice(0, 10).each((i, row) => {
  const titleCell = $(row).find('td.title');
  const link = titleCell.find('a').attr('href');
  const title = titleCell.text().replace(/\s+/g, ' ').trim().slice(0, 100);
  const loose = $(row).find('td.used_price').text().replace(/\s+/g, ' ').trim().slice(0, 20);
  console.log(`Row ${i+1}: [${title}] href=${link} loose=${loose}`);
});
