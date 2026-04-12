const cheerio = require('cheerio');
async function test() {
  const url = 'https://www.pricecharting.com/search-products?q=Sonic+The+Hedgehog+2+Sega+Genesis&type=videogames';
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const html = await res.text();
  const $ = cheerio.load(html);
  
  const firstRow = $('table#games_table tbody tr').first();
  console.log("Loose:", firstRow.find('td.used_price .js-price, td.used_price').text().trim().split('\n')[0]);
  console.log("CIB:", firstRow.find('td.cib_price .js-price, td.cib_price').text().trim().split('\n')[0]);
}
test();