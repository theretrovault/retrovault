#!/usr/bin/env node
/**
 * snapshot-value.mjs
 * Records today's estimated collection value to data/value-history.json.
 * Value is derived from inventory.json item prices.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '..', 'data');
const inventoryFile = join(dataDir, 'inventory.json');
const historyFile = join(dataDir, 'value-history.json');

const today = new Date().toISOString().slice(0, 10);

// Load inventory
let inventory = [];
if (existsSync(inventoryFile)) {
  try {
    const raw = JSON.parse(readFileSync(inventoryFile, 'utf8'));
    // Support both array and { items: [] } shapes
    inventory = Array.isArray(raw) ? raw : (raw.items || []);
  } catch (e) {
    console.error('Failed to parse inventory.json:', e.message);
    process.exit(1);
  }
}

// Calculate total estimated value
const totalValue = inventory.reduce((sum, item) => {
  const price = parseFloat(item.estimatedValue ?? item.price ?? item.value ?? 0);
  return sum + (isNaN(price) ? 0 : price);
}, 0);

const itemCount = inventory.length;

// Load existing history
let history = [];
if (existsSync(historyFile)) {
  try {
    history = JSON.parse(readFileSync(historyFile, 'utf8'));
    if (!Array.isArray(history)) history = [];
  } catch {
    history = [];
  }
}

// Check if today's snapshot already exists
const existing = history.find(e => e.date === today);
if (existing) {
  console.log(`Snapshot for ${today} already exists: $${existing.totalValue.toFixed(2)}`);
  process.exit(0);
}

// Append new snapshot
const snapshot = {
  date: today,
  totalValue: Math.round(totalValue * 100) / 100,
  itemCount,
  recordedAt: new Date().toISOString(),
};
history.push(snapshot);
history.sort((a, b) => a.date.localeCompare(b.date));

writeFileSync(historyFile, JSON.stringify(history, null, 2));
console.log(`Snapshot recorded for ${today}: $${snapshot.totalValue.toFixed(2)} across ${itemCount} items.`);
