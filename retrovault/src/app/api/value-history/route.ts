import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const FILE = path.join(process.cwd(), 'data', 'value-history.json');

export async function GET() {
  if (!fs.existsSync(FILE)) return NextResponse.json([]);
  const data = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
}
