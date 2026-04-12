const fs = require('fs');
const path = require('path');

const inventoryPath = path.join(__dirname, '..', 'data', 'inventory.json');
const data = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));

const migratedData = data.map(item => {
  let numCopies = 1;
  let copy2Price = "0";
  let copy2Box = false;

  const notesLower = (item.notes || "").toLowerCase();
  if (notesLower.includes("2 copies") || notesLower.includes("more than one copy") || notesLower.includes("2 in-box copies")) {
    numCopies = 2;
  }

  if (notesLower.includes("2nd was $3")) copy2Price = "3";
  if (notesLower.includes("2nd was $15")) copy2Price = "15";
  if (notesLower.includes("2 in-box copies")) copy2Box = true;

  const copies = [
    {
      id: Math.random().toString(36).substring(2, 10),
      hasBox: item.hasBox,
      hasManual: item.hasManual,
      priceAcquired: item.priceAcquired
    }
  ];

  if (numCopies > 1) {
    copies.push({
      id: Math.random().toString(36).substring(2, 10),
      hasBox: copy2Box,
      hasManual: copy2Box, // assuming in-box means box/manual for now, can be edited later
      priceAcquired: copy2Price
    });
  }

  // Pre-fill the new market values based on what was previously fetched
  let marketLoose = "0";
  let marketCib = "0";
  if (item.currentPrice && item.currentPrice !== "0" && item.currentPrice !== "N/A") {
    if (item.hasBox && item.hasManual) {
      marketCib = item.currentPrice;
    } else {
      marketLoose = item.currentPrice;
    }
  }

  return {
    id: item.id,
    title: item.title,
    platform: item.platform,
    status: item.status,
    notes: item.notes,
    lastFetched: item.lastFetched,
    marketLoose,
    marketCib,
    copies
  };
});

fs.writeFileSync(inventoryPath, JSON.stringify(migratedData, null, 2));
console.log("Migration complete!");
