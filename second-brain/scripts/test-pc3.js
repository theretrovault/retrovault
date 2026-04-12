const cheerio = require('cheerio');
async function test() {
  const url = 'https://www.pricecharting.com/search-products?q=Sonic+The+Hedgehog+2+Sega+Genesis&type=videogames';
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const html = await res.text();
  const $ = cheerio.load(html);
  console.log("Table classes/ids:", $('table').map((i, el) => $(el).attr('id') || $(el).attr('class')).get());
  console.log("First table HTML:", $('table').first().html()?.substring(0, 500));
}
test();