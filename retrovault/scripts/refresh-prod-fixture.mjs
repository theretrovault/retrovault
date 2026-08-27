#!/usr/bin/env node
// Refresh the committed prod-snapshot fixture from live Tower production data.
//
// WHY: GitHub Actions runners (cloud) cannot reach Tower (192.168.1.56), so CI
// runs the prodSnapshotAddFlow replay against the *committed* fixture in
// fixtures/prod-snapshot/. This script runs from a host that has SSH access to
// Tower (e.g. the dev VM) to pull fresh prod data, checkpoint the DB into a
// stable snapshot, strip personal notes, and stage the fixture for commit.
//
// Usage:
//   node scripts/refresh-prod-fixture.mjs [--keep-notes]
//
// Env (defaults shown):
//   TOWER_SSH_TARGET=tower   SSH alias (resolves to root@192.168.1.56)
//   TOWER_DATA_DIR=/mnt/user/appdata/retrovault/data
//
// This script NEVER modifies the live prod DB. It copies read-only.

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const here = path.resolve(path.dirname(new URL(import.meta.url).pathname));
const repoRoot = path.resolve(here, '..');
const FIXTURE_DIR = path.join(repoRoot, 'fixtures', 'prod-snapshot');
const KEEP_NOTES = process.argv.includes('--keep-notes');

const TOWER_SSH_TARGET = process.env.TOWER_SSH_TARGET || 'tower';
const TOWER_DATA_DIR = process.env.TOWER_DATA_DIR || '/mnt/user/appdata/retrovault/data';

function log(...a) { console.log('[refresh-prod-fixture]', ...a); }
function die(msg) { console.error('[refresh-prod-fixture] ERROR:', msg); process.exit(1); }

// Pull a remote file over ssh (honors the alias exactly). Returns a Promise.
function pullRemote(remoteFile, localFile) {
  return new Promise((resolve, reject) => {
    const out = fs.createWriteStream(localFile);
    const child = spawn('ssh', ['-o', 'BatchMode=yes', TOWER_SSH_TARGET, `cat ${JSON.stringify(remoteFile)}`]);
    child.stdout.pipe(out);
    child.on('error', (e) => { out.destroy(); reject(e); });
    out.on('finish', () => resolve());
    out.on('error', (e) => { out.destroy(); reject(e); });
    child.on('close', (code) => { if (code !== 0) { out.destroy(); reject(new Error('ssh cat exit ' + code)); } });
  });
}

async function main() {
  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'rv-prod-fix-'));
  const localDb = path.join(work, 'retrovault.db');
  const localInv = path.join(work, 'inventory.json');

  log('Pulling prod snapshot from', TOWER_SSH_TARGET, TOWER_DATA_DIR);
  try {
    await pullRemote(`${TOWER_DATA_DIR}/retrovault.db`, localDb);
    await pullRemote(`${TOWER_DATA_DIR}/inventory.json`, localInv);
  } catch (e) {
    die('Failed to pull from Tower: ' + e.message + ' (is it reachable via ssh ' + TOWER_SSH_TARGET + '?)');
  }
  // WAL is optional; ignore pull failure.
  try { await pullRemote(`${TOWER_DATA_DIR}/retrovault.db-wal`, path.join(work, 'retrovault.db-wal')); } catch { /* no WAL */ }

  // Checkpoint the WAL into the main DB so the committed fixture is self-contained.
  log('Checkpointing WAL -> main DB');
  const { default: Database } = await import('better-sqlite3');
  if (fs.existsSync(path.join(work, 'retrovault.db-wal'))) {
    try {
      const db = new Database(localDb);
      const res = db.pragma('wal_checkpoint(TRUNCATE)');
      log('checkpoint result:', JSON.stringify(res));
      db.close();
    } catch (e) {
      log('warn: checkpoint failed:', e.message, '(continuing with main DB only)');
    }
  }
  for (const f of ['retrovault.db-wal', 'retrovault.db-shm']) {
    const p = path.join(work, f);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }

  // Strip personal notes (unless --keep-notes).
  const invData = JSON.parse(fs.readFileSync(localInv, 'utf8'));
  const items = Array.isArray(invData) ? invData : (invData.items || []);
  if (!KEEP_NOTES) {
    let stripped = 0;
    for (const it of items) {
      if (typeof it.notes === 'string' && it.notes.trim()) { stripped++; it.notes = ''; }
    }
    log(`Stripped notes from ${stripped} items (use --keep-notes to preserve)`);
    fs.writeFileSync(localInv, JSON.stringify(invData, null, 2) + '\n');
  }

  // Write the fixture (raw bytes to avoid page-cache staleness on networked shares).
  fs.mkdirSync(FIXTURE_DIR, { recursive: true });
  fs.writeFileSync(path.join(FIXTURE_DIR, 'retrovault.db'), fs.readFileSync(localDb));
  fs.writeFileSync(path.join(FIXTURE_DIR, 'inventory.json'), fs.readFileSync(localInv));
  // Drop any SQLite lock artifacts so the committed fixture is just the three files.
  for (const f of ['retrovault.db-shm', 'retrovault.db-wal']) {
    const p2 = path.join(FIXTURE_DIR, f);
    if (fs.existsSync(p2)) fs.unlinkSync(p2);
  }
  const manifest = {
    source: `Tower ${TOWER_DATA_DIR}`,
    fetchedAt: new Date().toISOString(),
    keepNotes: KEEP_NOTES,
    notes: 'Read-only production snapshot used by src/__tests__/prodSnapshotAddFlow.test.ts. Refresh with: node scripts/refresh-prod-fixture.mjs',
  };
  fs.writeFileSync(path.join(FIXTURE_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');

  // Verify the canonical Battletoads row is present (the replay test requires it).
  const vdb = new Database(path.join(FIXTURE_DIR, 'retrovault.db'), { readonly: true });
  const row = vdb.prepare("SELECT id, status FROM Game WHERE id='genesis-battletoads-8fcf10f184'").get();
  vdb.close();
  if (!row) die('Canonical Battletoads row missing from fresh snapshot. Aborting (fixture NOT updated).');
  log('Canonical row present:', JSON.stringify(row));

  log('Fixture refreshed at', FIXTURE_DIR);
  log('Next: git add fixtures/prod-snapshot src/__tests__/prodSnapshotAddFlow.test.ts && git commit && git push');
}

main().catch((e) => die(e.message));
