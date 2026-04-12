const cheerio = require('cheerio');
async function test() {
  const url = 'https://www.pricecharting.com/search-products?q=Sonic+The+Hedgehog+2+Sega+Genesis&type=videogames';
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' } });
  const html = await res.text();
  const $ = cheerio.load(html);
  
  const loose = $('#used_price .price').text().trim();
  const firstRowLoose = $('table#games_tbody tr').first().find('td.used_price .js-price').text().trim();
  console.log("Direct Loose:", loose);
  console.log("Table Loose:", firstRowLoose);
  console.log("Title found:", $('h1').text().trim());
  if (!loose && !firstRowLoose) {
     console.log("HTML Sample:", html.substring(0, 500));
  }
}
test();
