import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const CL_FILE = path.join(process.cwd(), 'data', 'craigslist-deals.json');
const REDDIT_FILE = path.join(process.cwd(), 'data', 'reddit-alerts.json');

function load(file: string) {
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}
function save(file: string, data: any[]) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const source = url.searchParams.get('source') || 'all';

  const cl = source !== 'reddit' ? load(CL_FILE) : [];
  const reddit = source !== 'craigslist' ? load(REDDIT_FILE) : [];

  return NextResponse.json({ craigslist: cl, reddit }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { action, id, source } = body;
  const file = source === 'reddit' ? REDDIT_FILE : CL_FILE;
  const data = load(file);

  if (action === 'dismiss') {
    const idx = data.findIndex((d: any) => d.id === id);
    if (idx >= 0) { data[idx].dismissed = true; save(file, data); }
    return NextResponse.json({ ok: true });
  }
  if (action === 'restore') {
    const idx = data.findIndex((d: any) => d.id === id);
    if (idx >= 0) { data[idx].dismissed = false; save(file, data); }
    return NextResponse.json({ ok: true });
  }
  if (action === 'clear_dismissed') {
    save(file, data.filter((d: any) => !d.dismissed));
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
