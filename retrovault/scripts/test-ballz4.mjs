import { load } from 'cheerio';

const url = 'https://www.pricecharting.com/game/sega-genesis/ballz-3d';
const res = await fetch(url, {headers: {'User-Agent': 'Mozilla/5.0'}});
const html = await res.text();
const $ = load(html);

// Try various selectors for the product page prices
console.log('h1:', $('h1').first().text().trim());
console.log('#used_price:', $('#used_price').text().replace(/\s+/g,' ').trim().slice(0,50));
console.log('.js-price elements:', $('.js-price').map((i,el) => $(el).text().trim()).get().slice(0,10));
console.log('#price_table:', $('#price_table').text().replace(/\s+/g,' ').trim().slice(0,200));
// Try table rows  
$('#price_table tr').each((i,row) => {
  console.log('prow', i, $(row).text().replace(/\s+/g,' ').trim().slice(0,80));
});
