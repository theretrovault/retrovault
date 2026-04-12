import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const filePath = path.join(process.cwd(), 'data', 'goals.json');

function getData() {
  if (!fs.existsSync(filePath)) return { priorities: {} };
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}
function saveData(data: any) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

export async function GET() {
  return NextResponse.json(getData(), { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: Request) {
  const { platform, priority } = await req.json();
  const data = getData();
  if (priority === null || priority === undefined) {
    delete data.priorities[platform];
  } else {
    data.priorities[platform] = priority;
  }
  saveData(data);
  return NextResponse.json({ ok: true });
}
