import { parse } from 'csv-parse/sync';
import https from 'https';
import fs from 'fs';
import path from 'path';

const gids = [
  "0", "1117615872", "1250668992", "1307565087", "1441051414", "1697208994", 
  "1738184210", "1826734472", "1867622617", "1910668230", "1945176599", 
  "303930381", "378888464", "427836831", "817136195", "824072106", 
  "863465312", "914164964", "935558415"
];

const gidNames = {
  "0": "Sega Genesis",
  "863465312": "NES",
  "1307565087": "SNES",
  "1738184210": "N64",
  "1697208994": "Gamecube",
  "303930381": "Nintendo Switch",
  "914164964": "Playstation 1",
  "935558415": "Playstation 2",
  "1441051414": "Playstation 3",
  "1826734472": "Sony PSP",
  "378888464": "Xbox",
  "1945176599": "Xbox 360",
  "1117615872": "Sega CD",
  "1910668230": "Sega Dreamcast",
  "1867622617": "Unknown Platform"
};

async function fetchCsv(gid) {
  return new Promise((resolve, reject) => {
    https.get(`https://docs.google.com/spreadsheets/d/1As-D5Vm5Wse8J2y8xTAVvffLiJ7eKlgMytltqBmY62w/export?format=csv&gid=${gid}`, (res) => {
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
  const dest = path.join(process.cwd(), 'data', 'inventory.json');
  let existingInventory = [];
  if (fs.existsSync(dest)) {
    existingInventory = JSON.parse(fs.readFileSync(dest, 'utf8'));
  }

  const inventoryMap = new Map();
  for (const item of existingInventory) {
    inventoryMap.set(`${item.title.toLowerCase()}|${item.platform.toLowerCase()}`, item);
  }

  for (const gid of gids) {
    const csvData = await fetchCsv(gid);
    
    try {
      const records = parse(csvData, { skip_empty_lines: true, relax_column_count: true });
      if (records.length < 5) continue;
      
      let headerRowIndex = -1;
      for (let i = 0; i < Math.min(20, records.length); i++) {
        if (records[i][0] === 'Title' && records[i][1] === 'Owned') {
          headerRowIndex = i;
          break;
        }
      }

      if (headerRowIndex === -1) continue;

      let consoleName = gidNames[gid];
      if (!consoleName) {
        const firstRow = records[0];
        const possibleName = firstRow.find(cell => cell && cell.trim() !== '' && cell.trim() !== 'Note' && cell.trim() !== 'Platform');
        consoleName = possibleName || "Unknown";
      }

      for (let i = headerRowIndex + 1; i < records.length; i++) {
        const row = records[i];
        if (row.length < 2) continue;
        
        const titleRaw = row[0].trim();
        if (!titleRaw) continue;

        const title = titleRaw.split('\n')[0].replace(/"/g, '').trim();
        const ownedStr = row[1].trim().toLowerCase();
        const isOwned = ownedStr && ownedStr !== 'no' && ownedStr !== 'false' && ownedStr !== '0';

        const key = `${title.toLowerCase()}|${consoleName.toLowerCase()}`;

        if (inventoryMap.has(key)) {
          // Already have it. If the spreadsheet says we don't own it anymore but the UI does, we leave UI as truth.
          continue;
        }

        const hasBox = row[2] ? row[2].trim() : '';
        const hasManual = row[3] ? row[3].trim() : '';
        const priceAcquired = row[5] ? row[5].trim().replace('$', '') : '0';
        const notes = row[8] ? row[8].trim() : '';

        const copies = [];
        if (isOwned) {
          copies.push({
            id: Math.random().toString(36).substring(2, 10),
            hasBox: hasBox.toLowerCase() === 'yes' || hasBox === '1' || hasBox.toLowerCase() === 'x',
            hasManual: hasManual.toLowerCase() === 'yes' || hasManual === '1' || hasManual.toLowerCase() === 'x',
            priceAcquired: priceAcquired || '0',
            condition: 'Good'
          });
        }

        inventoryMap.set(key, {
          id: Math.random().toString(36).substring(2, 10),
          title,
          platform: consoleName,
          status: isOwned ? "Yes" : "No",
          notes,
          marketLoose: "0",
          marketCib: "0",
          copies
        });
      }
    } catch (e) {
      console.log(`Failed to parse GID ${gid}`, e.message);
    }
  }

  const finalInventory = Array.from(inventoryMap.values());
  fs.writeFileSync(dest, JSON.stringify(finalInventory, null, 2));
  console.log(`Successfully merged inventory data! Total games: ${finalInventory.length}`);
}

run();
