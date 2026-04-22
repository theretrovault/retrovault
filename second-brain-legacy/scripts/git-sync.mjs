#!/usr/bin/env node
/**
 * git-sync.mjs
 * Auto-commits and pushes uncommitted changes in the workspace repo.
 * Logs activity to logs/git-sync.log.
 */

import { execSync } from 'child_process';
import { appendFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..', '..');
const logFile = join(__dirname, '..', 'logs', 'git-sync.log');

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  process.stdout.write(line);
  try {
    mkdirSync(join(__dirname, '..', 'logs'), { recursive: true });
    appendFileSync(logFile, line);
  } catch {}
}

function run(cmd, opts = {}) {
  return execSync(cmd, { cwd: repoRoot, encoding: 'utf8', ...opts }).trim();
}

try {
  const status = run('git status --porcelain');
  if (!status) {
    log('Nothing to commit. Repo is clean.');
    process.exit(0);
  }

  log(`Changes detected:\n${status}`);

  run('git add -A');
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
  run(`git commit -m "chore: auto-sync [${timestamp}]"`);
  log('Committed changes.');

  const pushResult = run('git push');
  log(`Pushed. ${pushResult || 'OK'}`);
} catch (err) {
  log(`ERROR: ${err.message}`);
  process.exit(1);
}
