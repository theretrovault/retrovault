import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

export const dynamic = 'force-dynamic';

const execAsync = promisify(exec);
const SCRAPERS_FILE = path.join(process.cwd(), 'data', 'scrapers.json');
const LOGS_DIR = path.join(process.cwd(), 'logs');

type Scraper = {
  id: string; name: string; description: string; script: string; logFile: string;
  featureGroup: string | null; enabled: boolean; status: string;
  lastRun: string | null; lastRunStatus: string | null; nextRun: string | null;
  cadenceHour: number; cadenceType: string; itemsProcessed: number; itemsTotal: number;
  defaultCadenceHour: number; pid?: number;
};

function loadScrapers(): Scraper[] {
  if (!fs.existsSync(SCRAPERS_FILE)) return [];
  return JSON.parse(fs.readFileSync(SCRAPERS_FILE, 'utf8'));
}

function saveScrapers(scrapers: Scraper[]) {
  fs.writeFileSync(SCRAPERS_FILE, JSON.stringify(scrapers, null, 2));
}

function getLogTail(logFile: string, lines = 50): string[] {
  const logPath = path.join(process.cwd(), logFile);
  if (!fs.existsSync(logPath)) return [];
  const content = fs.readFileSync(logPath, 'utf8');
  return content.split('\n').filter(Boolean).slice(-lines);
}

function getLogSize(logFile: string): number {
  const logPath = path.join(process.cwd(), logFile);
  if (!fs.existsSync(logPath)) return 0;
  return fs.statSync(logPath).size;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  const logLines = url.searchParams.get('log');

  const scrapers = loadScrapers();

  if (id && logLines) {
    const scraper = scrapers.find(s => s.id === id);
    if (!scraper) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const lines = getLogTail(scraper.logFile, parseInt(logLines) || 50);
    return NextResponse.json({ lines, size: getLogSize(scraper.logFile) });
  }

  // Enrich with log info
  const enriched = scrapers.map(s => ({
    ...s,
    logSize: getLogSize(s.logFile),
    logExists: fs.existsSync(path.join(process.cwd(), s.logFile)),
  }));

  return NextResponse.json(enriched, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: Request) {
  const body = await req.json();
  const scrapers = loadScrapers();
  const { action, id } = body;

  const idx = scrapers.findIndex(s => s.id === id);

  if (action === 'run') {
    if (idx < 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const scraper = scrapers[idx];
    const scriptPath = path.join(process.cwd(), scraper.script);

    if (!fs.existsSync(scriptPath)) {
      return NextResponse.json({ error: `Script not found: ${scraper.script}` }, { status: 404 });
    }

    if (!fs.existsSync(LOGS_DIR)) fs.mkdirSync(LOGS_DIR, { recursive: true });

    // Run in background, log to file
    const logPath = path.join(process.cwd(), scraper.logFile);
    const cmd = `node ${scriptPath} >> ${logPath} 2>&1 &`;

    scrapers[idx].status = 'running';
    scrapers[idx].lastRun = new Date().toISOString();
    saveScrapers(scrapers);

    exec(cmd, (err) => {
      const s2 = loadScrapers();
      const i2 = s2.findIndex(s => s.id === id);
      if (i2 >= 0) {
        s2[i2].status = err ? 'error' : 'idle';
        s2[i2].lastRunStatus = err ? 'error' : 'success';
        saveScrapers(s2);
      }
    });

    return NextResponse.json({ ok: true, status: 'running' });
  }

  if (action === 'toggle_enabled') {
    if (idx < 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    scrapers[idx].enabled = !scrapers[idx].enabled;
    saveScrapers(scrapers);
    return NextResponse.json(scrapers[idx]);
  }

  if (action === 'update_cadence') {
    if (idx < 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    scrapers[idx].cadenceHour = body.cadenceHour;
    scrapers[idx].cadenceType = body.cadenceType;
    saveScrapers(scrapers);

    // Update crontab for this scraper
    try {
      const { stdout: currentCron } = await execAsync('crontab -l 2>/dev/null || echo ""');
      const scriptName = path.basename(scrapers[idx].script, '.mjs');
      const logPath = path.join(process.cwd(), scrapers[idx].logFile);
      const scriptPath = path.join(process.cwd(), scrapers[idx].script);

      // Remove existing entry for this script
      const lines = currentCron.split('\n').filter(l => !l.includes(scriptName));

      // Build cron expression
      let cronExpr = '';
      if (body.cadenceType === 'hourly') {
        cronExpr = `0 */${body.cadenceHour} * * *`;
      } else if (body.cadenceType === 'daily') {
        cronExpr = `0 ${body.cadenceHour} * * *`;
      } else if (body.cadenceType === 'weekly') {
        cronExpr = `0 ${body.cadenceHour} * * 1`;
      }

      if (scrapers[idx].enabled && fs.existsSync(scriptPath)) {
        lines.push(`${cronExpr} node ${scriptPath} >> ${logPath} 2>&1`);
      }

      const newCron = lines.filter(Boolean).join('\n') + '\n';
      await execAsync(`echo "${newCron.replace(/"/g, '\\"')}" | crontab -`);
    } catch (e) {
      console.error('Cron update failed:', e);
    }

    return NextResponse.json(scrapers[idx]);
  }

  if (action === 'clear_log') {
    if (idx < 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const logPath = path.join(process.cwd(), scrapers[idx].logFile);
    if (fs.existsSync(logPath)) fs.writeFileSync(logPath, '');
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
