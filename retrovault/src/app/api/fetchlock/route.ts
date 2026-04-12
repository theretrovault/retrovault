import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const lockFile = path.join(process.cwd(), 'data', 'fetch.lock');

export async function GET() {
  const locked = fs.existsSync(lockFile);
  const lockData = locked ? JSON.parse(fs.readFileSync(lockFile, 'utf8')) : null;
  return NextResponse.json({ locked, lockData });
}

export async function POST(req: Request) {
  const { action } = await req.json();

  if (action === 'acquire') {
    fs.writeFileSync(lockFile, JSON.stringify({
      acquiredAt: new Date().toISOString(),
      source: 'ui'
    }));
    return NextResponse.json({ ok: true, locked: true });
  }

  if (action === 'release') {
    if (fs.existsSync(lockFile)) fs.unlinkSync(lockFile);
    return NextResponse.json({ ok: true, locked: false });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
