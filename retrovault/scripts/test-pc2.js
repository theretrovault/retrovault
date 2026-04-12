const cheerio = require('cheerio');
async function test() {
  const url = 'https://www.pricecharting.com/search-products?q=Sonic+The+Hedgehog+2+Sega+Genesis&type=videogames';
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' } });
  const html = await res.text();
  const $ = cheerio.load(html);
  
  const firstRowLoose = $('#games_tbody tr').first().find('td.used_price .js-price').text().trim();
  const firstRowCib = $('#games_tbody tr').first().find('td.cib_price .js-price').text().trim();
  console.log("Loose:", firstRowLoose);
  console.log("CIB:", firstRowCib);
  if (!firstRowLoose) {
      console.log("HTML:", $('#games_tbody').html());
  }
}
test();
