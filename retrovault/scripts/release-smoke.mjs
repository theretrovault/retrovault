#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const args = process.argv.slice(2);

const options = {
  baseUrl: process.env.SMOKE_BASE_URL || null,
  pagePaths: ['/', '/inventory', '/analytics', '/sales'],
  apiPaths: ['/api/auth'],
  timeoutMs: Number(process.env.SMOKE_TIMEOUT_MS || 10000),
  assetLimit: Number(process.env.SMOKE_ASSET_LIMIT || 8),
  assetPaths: [],
};

for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];
  const next = args[i + 1];

  if (arg === '--base-url' && next) {
    options.baseUrl = next;
    i += 1;
  } else if (arg === '--page' && next) {
    options.pagePaths.push(next);
    i += 1;
  } else if (arg === '--api' && next) {
    options.apiPaths.push(next);
    i += 1;
  } else if (arg === '--asset' && next) {
    options.assetPaths.push(next);
    i += 1;
  } else if (arg === '--timeout-ms' && next) {
    options.timeoutMs = Number(next);
    i += 1;
  } else if (arg === '--asset-limit' && next) {
    options.assetLimit = Number(next);
    i += 1;
  }
}

function log(message) {
  console.log(`[release-smoke] ${message}`);
}

function fail(message) {
  console.error(`[release-smoke] ERROR: ${message}`);
  process.exit(1);
}

function normalizePath(value) {
  if (!value) return '/';
  return value.startsWith('/') ? value : `/${value}`;
}

async function fetchText(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs);

  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'user-agent': 'retrovault-release-smoke/1.0',
        accept: 'text/html,application/json,*/*',
      },
    });

    const text = await response.text();
    return { response, text };
  } catch (error) {
    throw new Error(`${url} request failed: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    clearTimeout(timeout);
  }
}

function getAssetRefsFromHtml(html) {
  const refs = new Set();
  const regex = /(?:href|src)=["']([^"']*\/_next\/static\/[^"']+)["']/g;
  let match;

  while ((match = regex.exec(html)) !== null) {
    refs.add(match[1]);
  }

  return Array.from(refs);
}

async function verifyHttpMode(baseUrl) {
  log(`Smoke testing live runtime at ${baseUrl}`);

  const pageAssets = new Set(options.assetPaths.map(normalizePath));

  for (const pagePath of options.pagePaths.map(normalizePath)) {
    const url = new URL(pagePath, baseUrl).toString();
    const { response, text } = await fetchText(url);

    if (!response.ok) {
      fail(`Page ${pagePath} returned ${response.status}`);
    }

    if (!text.includes('<html')) {
      fail(`Page ${pagePath} did not return HTML`);
    }

    const authShellCount = (text.match(/AUTHENTICATING\.\.\./g) || []).length;
    if (authShellCount > 1) {
      fail(`Page ${pagePath} rendered duplicate auth shells (${authShellCount})`);
    }

    const assetRefs = getAssetRefsFromHtml(text);
    if (assetRefs.length === 0) {
      fail(`Page ${pagePath} referenced no /_next/static assets`);
    }

    assetRefs.slice(0, options.assetLimit).forEach((assetPath) => pageAssets.add(normalizePath(assetPath)));
    log(`Page ${pagePath} OK, found ${assetRefs.length} asset refs`);
  }

  for (const apiPath of options.apiPaths.map(normalizePath)) {
    const url = new URL(apiPath, baseUrl).toString();
    const { response } = await fetchText(url);
    if (!response.ok) {
      fail(`API ${apiPath} returned ${response.status}`);
    }
    log(`API ${apiPath} OK (${response.status})`);
  }

  for (const assetPath of pageAssets) {
    const url = new URL(assetPath, baseUrl).toString();
    const { response } = await fetchText(url);
    if (!response.ok) {
      fail(`Asset ${assetPath} returned ${response.status}`);
    }
    log(`Asset ${assetPath} OK`);
  }
}

function verifyBuildMode() {
  log('Smoke testing local build artifacts');

  const manifestPath = path.join(rootDir, '.next', 'build-manifest.json');
  if (!fs.existsSync(manifestPath)) {
    fail(`Missing manifest: ${manifestPath}`);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const pages = manifest.pages || {};
  const app = manifest.rootMainFiles || [];

  const candidateFiles = new Set([
    ...app,
    ...(pages['/'] || []),
    ...(pages['/inventory'] || []),
  ]);

  const assetFiles = Array.from(candidateFiles)
    .filter((file) => typeof file === 'string' && file.startsWith('static/'))
    .map((file) => path.join(rootDir, '.next', file));

  if (assetFiles.length === 0) {
    fail('No static asset files discovered in build manifest');
  }

  for (const assetFile of assetFiles) {
    if (!fs.existsSync(assetFile)) {
      fail(`Manifest referenced missing asset: ${assetFile}`);
    }
    const stats = fs.statSync(assetFile);
    if (!stats.isFile() || stats.size === 0) {
      fail(`Asset missing or empty: ${assetFile}`);
    }
    log(`Asset OK: ${path.relative(rootDir, assetFile)}`);
  }

  const requiredServerFiles = [
    path.join(rootDir, '.next', 'prerender-manifest.json'),
    path.join(rootDir, '.next', 'server', 'app', 'index.html'),
    path.join(rootDir, '.next', 'server', 'app', 'inventory.html'),
  ];

  for (const filePath of requiredServerFiles) {
    if (!fs.existsSync(filePath)) {
      fail(`Expected build output missing: ${filePath}`);
    }
    log(`Build output OK: ${path.relative(rootDir, filePath)}`);
  }
}

async function main() {
  if (options.baseUrl) {
    await verifyHttpMode(options.baseUrl);
  } else {
    verifyBuildMode();
  }

  log('Smoke test passed');
}

main().catch((error) => fail(error instanceof Error ? error.message : String(error)));
