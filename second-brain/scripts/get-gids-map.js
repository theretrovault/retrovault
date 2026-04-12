const https = require('https');
https.get("https://docs.google.com/spreadsheets/d/1As-D5Vm5Wse8J2y8xTAVvffLiJ7eKlgMytltqBmY62w/htmlview", (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const regex = /<li id="sheet-button-(.*?)".*?>(.*?)<\/li>/g;
    let match;
    const map = {};
    while ((match = regex.exec(data)) !== null) {
      // Strip out tags from the name just in case
      let name = match[2].replace(/<[^>]*>?/gm, '');
      map[match[1]] = name;
    }
    console.log(JSON.stringify(map, null, 2));
  });
});
