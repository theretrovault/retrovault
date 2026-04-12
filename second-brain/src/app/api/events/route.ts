import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const FILE = path.join(process.cwd(), 'data', 'events.json');

type GameEvent = {
  id: string; title: string; dateRaw: string; date?: string;
  location: string; venue?: string; url?: string; source: string;
  type: string; description?: string; scrapedAt?: string;
  attending: boolean; interested: boolean; notes?: string;
};

function load(): GameEvent[] {
  if (!fs.existsSync(FILE)) return [];
  return JSON.parse(fs.readFileSync(FILE, 'utf8'));
}
function save(d: GameEvent[]) { fs.writeFileSync(FILE, JSON.stringify(d, null, 2)); }

export async function GET() {
  return NextResponse.json(load(), { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: Request) {
  const body = await req.json();
  const data = load();
  const { action } = body;

  if (action === 'toggle_attending') {
    const idx = data.findIndex(e => e.id === body.id);
    if (idx >= 0) { data[idx].attending = !data[idx].attending; save(data); return NextResponse.json(data[idx]); }
  }

  if (action === 'toggle_interested') {
    const idx = data.findIndex(e => e.id === body.id);
    if (idx >= 0) { data[idx].interested = !data[idx].interested; save(data); return NextResponse.json(data[idx]); }
  }

  if (action === 'add_notes') {
    const idx = data.findIndex(e => e.id === body.id);
    if (idx >= 0) { data[idx].notes = body.notes; save(data); return NextResponse.json(data[idx]); }
  }

  if (action === 'add_manual') {
    const event: GameEvent = {
      id: `manual-${Date.now()}`,
      title: body.title, dateRaw: body.date, date: body.date,
      location: body.location || '', venue: body.venue || '',
      url: body.url || '', source: 'manual', type: 'gaming',
      description: body.description || '',
      scrapedAt: new Date().toISOString(),
      attending: body.attending || false,
      interested: body.interested || false,
    };
    data.unshift(event);
    save(data);
    return NextResponse.json(event);
  }

  if (action === 'delete') {
    save(data.filter(e => e.id !== body.id));
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
