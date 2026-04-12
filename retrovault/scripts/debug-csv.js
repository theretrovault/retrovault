const https = require('https');
const fs = require('fs');

async function fetchCsv(gid) {
  return new Promise((resolve, reject) => {
    https.get(`https://docs.google.com/spreadsheets/d/1As-D5Vm5Wse8J2y8xTAVvffLiJ7eKlgMytltqBmY62w/export?format=csv&gid=${gid}`, (res) => {
      // Need to handle 302 redirects for large Google Sheets
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        https.get(res.headers.location, (res2) => {
          let data = '';
          res2.on('data', chunk => data += chunk);
          res2.on('end', () => resolve(data));
          res2.on('error', reject);
        }).on('error', reject);
      } else {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
        res.on('error', reject);
      }
    }).on('error', reject);
  });
}

async function run() {
  const gids = ["863465312", "1117615872"];
  for (const gid of gids) {
    const csv = await fetchCsv(gid);
    console.log(`GID ${gid} length: ${csv.length}`);
    const lines = csv.split('\n').map(l => l.trim());
    let headerIndex = -1;
    for (let i = 0; i < Math.min(20, lines.length); i++) {
      if (lines[i].startsWith('Title,Owned')) {
        headerIndex = i;
        break;
      }
    }
    console.log(`Header index: ${headerIndex}`);
    if (headerIndex !== -1) {
      for (let i = headerIndex + 1; i < headerIndex + 10; i++) {
        console.log(`Row: ${lines[i]}`);
      }
    }
  }
}
run();
