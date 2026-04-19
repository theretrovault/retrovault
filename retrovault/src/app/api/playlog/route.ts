import { NextResponse } from 'next/server';
import fs from 'fs';
import { resolveDataPath } from '@/lib/runtimePaths';

export const dynamic = 'force-dynamic';

const FILE = resolveDataPath('playlog.json');

type PlayLogEntry = {
  id: string;
  title: string;
  platform: string;
  status: 'playing' | 'beat' | 'gave_up' | 'want_to_play' | 'backlog';
  rating?: number; // 1-5
  notes?: string;
  startedAt?: string;
  finishedAt?: string;
  updatedAt: string;
};

function load(): PlayLogEntry[] {
  if (!fs.existsSync(FILE)) return [];
  return JSON.parse(fs.readFileSync(FILE, 'utf8'));
}
function save(data: PlayLogEntry[]) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

export async function GET() {
  return NextResponse.json(load(), { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: Request) {
  const body = await req.json();
  const data = load();
  const { action } = body;

  if (action === 'upsert') {
    const entry: PlayLogEntry = {
      id: body.id || `${body.title}-${body.platform}-${Date.now()}`.replace(/\s+/g, '-').toLowerCase(),
      title: body.title,
      platform: body.platform,
      status: body.status,
      rating: body.rating,
      notes: body.notes,
      startedAt: body.startedAt,
      finishedAt: body.finishedAt,
      updatedAt: new Date().toISOString(),
    };
    const idx = data.findIndex(e => e.id === entry.id);
    if (idx >= 0) data[idx] = entry;
    else data.unshift(entry);
    save(data);
    return NextResponse.json(entry);
  }

  if (action === 'delete') {
    const filtered = data.filter(e => e.id !== body.id);
    save(filtered);
    return NextResponse.json({ ok: true });
  }

  if (action === 'set_status') {
    const idx = data.findIndex(e => e.id === body.id);
    if (idx >= 0) {
      data[idx].status = body.status;
      data[idx].updatedAt = new Date().toISOString();
      if (body.status === 'beat') data[idx].finishedAt = data[idx].finishedAt || new Date().toISOString();
      if (body.status === 'playing') data[idx].startedAt = data[idx].startedAt || new Date().toISOString();
      save(data);
      return NextResponse.json(data[idx]);
    }
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
