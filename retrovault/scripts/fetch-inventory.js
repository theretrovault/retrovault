const https = require('https');
const fs = require('fs');
const path = require('path');

const gids = [
  "1117615872", "1250668992", "1307565087", "1441051414", "1697208994", 
  "1738184210", "1826734472", "1867622617", "1910668230", "1945176599", 
  "303930381", "378888464", "427836831", "817136195", "824072106", 
  "863465312", "914164964", "935558415"
];

const ownedGames = [];

async function fetchCsv(gid) {
  return new Promise((resolve, reject) => {
    https.get(`https://docs.google.com/spreadsheets/d/1As-D5Vm5Wse8J2y8xTAVvffLiJ7eKlgMytltqBmY62w/export?format=csv&gid=${gid}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function parseCsv(csvText, consoleName = "Unknown") {
  const lines = csvText.split('\n').map(l => l.trim());
  let headerIndex = -1;
  for (let i = 0; i < Math.min(20, lines.length); i++) {
    if (lines[i].startsWith('Title,Owned')) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) return; // not a game list sheet

  // Try to guess console name from cell A1
  let guessedConsole = lines[0].split(',')[0].trim();
  if (guessedConsole && guessedConsole !== "Platform" && guessedConsole.length > 0) {
    consoleName = guessedConsole;
  }

  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    
    // Naive CSV split (won't perfectly handle commas in quotes, but good enough for a quick parse)
    // Actually let's use a slightly better split
    let cells = [];
    let cur = '';
    let inQuote = false;
    for (let char of line) {
      if (char === '"') inQuote = !inQuote;
      else if (char === ',' && !inQuote) {
        cells.push(cur);
        cur = '';
      } else cur += char;
    }
    cells.push(cur);

    if (cells.length < 2) continue;
    
    const title = cells[0].trim();
    const owned = cells[1].trim();
    if (owned && owned.toLowerCase() !== 'false' && owned !== '0' && title.length > 0) {
      const hasBox = cells[2] ? cells[2].trim() : '';
      const hasManual = cells[3] ? cells[3].trim() : '';
      const currentPrice = cells[6] ? cells[6].trim() : '';
      const notes = cells[8] ? cells[8].trim() : '';

      ownedGames.push({
        title,
        console: consoleName,
        ownedAmount: owned,
        hasBox: hasBox.length > 0 && hasBox !== '0',
        hasManual: hasManual.length > 0 && hasManual !== '0',
        currentPrice: currentPrice,
        notes
      });
    }
  }
}

async function run() {
  for (const gid of gids) {
    const csv = await fetchCsv(gid);
    parseCsv(csv);
  }
  
  const dest = path.join(__dirname, '..', 'data', 'inventory.json');
  fs.writeFileSync(dest, JSON.stringify(ownedGames, null, 2));
  console.log(`Saved ${ownedGames.length} owned games to public/inventory.json`);
}

run();
