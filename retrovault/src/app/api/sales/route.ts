import { NextResponse } from 'next/server';
import fs from 'fs';
import { resolveDataPath } from '@/lib/runtimePaths';

const salesPath = resolveDataPath('sales.json');
const acqPath = resolveDataPath('acquisitions.json');
const watchlistPath = resolveDataPath('watchlist.json');

export const dynamic = 'force-dynamic';

function read(filePath: string) {
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}
function save(filePath: string, data: any[]) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'sales';
  const filePath = type === 'acquisitions' ? acqPath : type === 'watchlist' ? watchlistPath : salesPath;
  return NextResponse.json(read(filePath), { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { type = 'sales', action, item } = body;
  const filePath = type === 'acquisitions' ? acqPath : type === 'watchlist' ? watchlistPath : salesPath;
  let data = read(filePath);

  if (action === 'add') {
    const entry = { ...item, id: Date.now().toString(), createdAt: new Date().toISOString() };
    data.push(entry);
    save(filePath, data);
    return NextResponse.json(entry, { status: 201 });
  }

  if (action === 'update') {
    const idx = data.findIndex((e: any) => e.id === item.id);
    if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    data[idx] = { ...data[idx], ...item };
    save(filePath, data);
    return NextResponse.json(data[idx]);
  }

  if (action === 'delete') {
    data = data.filter((e: any) => e.id !== item.id);
    save(filePath, data);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
