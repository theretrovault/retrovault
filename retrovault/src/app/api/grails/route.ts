import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const FILE = path.join(process.cwd(), 'data', 'grails.json');

type GrailEntry = {
  id: string;
  title: string;
  platform: string;
  notes?: string;
  priority: 1 | 2 | 3; // 1=must have, 2=want, 3=someday
  addedAt: string;
  acquiredAt?: string; // set when found!
};

function load(): GrailEntry[] {
  if (!fs.existsSync(FILE)) return [];
  return JSON.parse(fs.readFileSync(FILE, 'utf8'));
}
function save(data: GrailEntry[]) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

export async function GET() {
  return NextResponse.json(load(), { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: Request) {
  const body = await req.json();
  const data = load();
  const { action } = body;

  if (action === 'add') {
    const entry: GrailEntry = {
      id: `${body.title}-${body.platform}-${Date.now()}`.replace(/\s+/g, '-').toLowerCase(),
      title: body.title,
      platform: body.platform,
      notes: body.notes || '',
      priority: body.priority || 2,
      addedAt: new Date().toISOString(),
    };
    data.unshift(entry);
    save(data);
    return NextResponse.json(entry);
  }

  if (action === 'acquired') {
    const idx = data.findIndex(e => e.id === body.id);
    if (idx >= 0) {
      data[idx].acquiredAt = new Date().toISOString();
      save(data);
      return NextResponse.json(data[idx]);
    }
  }

  if (action === 'update') {
    const idx = data.findIndex(e => e.id === body.id);
    if (idx >= 0) {
      data[idx] = { ...data[idx], ...body, action: undefined };
      save(data);
      return NextResponse.json(data[idx]);
    }
  }

  if (action === 'delete') {
    save(data.filter(e => e.id !== body.id));
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
