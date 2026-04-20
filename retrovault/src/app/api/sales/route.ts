import { NextResponse } from 'next/server';
import fs from 'fs';
import { resolveDataPath } from '@/lib/runtimePaths';
import {
  addWatchlistCompat,
  deleteWatchlistCompat,
  readWatchlistCompat,
  updateWatchlistCompat,
} from '@/lib/storageCompat';

const salesPath = resolveDataPath('sales.json');
const acqPath = resolveDataPath('acquisitions.json');

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
  if (type === 'watchlist') {
    const watchlist = await readWatchlistCompat();
    return NextResponse.json(watchlist, { headers: { 'Cache-Control': 'no-store' } });
  }
  const filePath = type === 'acquisitions' ? acqPath : salesPath;
  return NextResponse.json(read(filePath), { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { type = 'sales', action, item } = body;

  if (type === 'watchlist') {
    if (action === 'add') {
      const entry = await addWatchlistCompat(item);
      return NextResponse.json(entry, { status: 201 });
    }

    if (action === 'update') {
      const updated = await updateWatchlistCompat(item);
      if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json(updated);
    }

    if (action === 'delete') {
      const deleted = await deleteWatchlistCompat(item.id);
      if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json({ ok: true });
    }
  }

  const filePath = type === 'acquisitions' ? acqPath : salesPath;
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
