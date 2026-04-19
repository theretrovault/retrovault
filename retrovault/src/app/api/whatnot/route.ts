import { NextResponse } from 'next/server';
import fs from 'fs';
import { resolveDataPath } from '@/lib/runtimePaths';

export const dynamic = 'force-dynamic';

const FILE = resolveDataPath('whatnot.json');

type Seller = {
  username: string; displayName: string; specialty: string;
  twitterUrl?: string; instagramUrl?: string; notes?: string;
  addedAt: string; notifyBefore?: number; // minutes
};

type Stream = {
  id: string; seller: string; title: string;
  startTime?: string; scheduledText?: string;
  url: string; source: string; scrapedAt: string;
  dismissed?: boolean; attending?: boolean;
};

type WhatnotData = {
  sellers: Seller[]; streams: Stream[];
  lastChecked: string | null; sellerStatuses?: Record<string, any>;
};

function load(): WhatnotData {
  if (!fs.existsSync(FILE)) return { sellers: [], streams: [], lastChecked: null };
  return JSON.parse(fs.readFileSync(FILE, 'utf8'));
}
function save(d: WhatnotData) { fs.writeFileSync(FILE, JSON.stringify(d, null, 2)); }

export async function GET() {
  return NextResponse.json(load(), { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: Request) {
  const body = await req.json();
  const data = load();
  const { action } = body;

  if (action === 'add_seller') {
    const seller: Seller = {
      username: body.username.toLowerCase().replace(/\s+/g, ''),
      displayName: body.displayName || body.username,
      specialty: body.specialty || '',
      twitterUrl: body.twitterUrl || '',
      instagramUrl: body.instagramUrl || '',
      notes: body.notes || '',
      notifyBefore: body.notifyBefore || 30,
      addedAt: new Date().toISOString(),
    };
    if (!data.sellers.find(s => s.username === seller.username)) {
      data.sellers.push(seller);
    }
    save(data);
    return NextResponse.json(seller);
  }

  if (action === 'remove_seller') {
    data.sellers = data.sellers.filter(s => s.username !== body.username);
    save(data);
    return NextResponse.json({ ok: true });
  }

  if (action === 'add_stream') {
    const stream: Stream = {
      id: `manual-${Date.now()}`,
      seller: body.seller,
      title: body.title || `${body.seller} live stream`,
      startTime: body.startTime,
      scheduledText: body.scheduledText,
      url: body.url || `https://www.whatnot.com/user/${body.seller}`,
      source: 'manual',
      scrapedAt: new Date().toISOString(),
    };
    data.streams.unshift(stream);
    save(data);
    return NextResponse.json(stream);
  }

  if (action === 'dismiss_stream') {
    const idx = data.streams.findIndex(s => s.id === body.id);
    if (idx >= 0) { data.streams[idx].dismissed = true; save(data); }
    return NextResponse.json({ ok: true });
  }

  if (action === 'attending') {
    const idx = data.streams.findIndex(s => s.id === body.id);
    if (idx >= 0) { data.streams[idx].attending = !data.streams[idx].attending; save(data); }
    return NextResponse.json({ ok: true });
  }

  if (action === 'update_seller') {
    const idx = data.sellers.findIndex(s => s.username === body.username);
    if (idx >= 0) { data.sellers[idx] = { ...data.sellers[idx], ...body, action: undefined }; save(data); }
    return NextResponse.json(data.sellers[idx] ?? {});
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
