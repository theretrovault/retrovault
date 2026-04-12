import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const filePath = path.join(process.cwd(), 'data', 'tags.json');

function getData() {
  if (!fs.existsSync(filePath)) return { gameTags: {}, platformTags: {}, mentions: {} };
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}
function saveData(data: any) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

export async function GET() {
  return NextResponse.json(getData(), { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: Request) {
  const body = await req.json();
  const data = getData();
  const { action, entityId, entityType, tag, mention } = body;

  if (action === 'add_tag') {
    const store = entityType === 'platform' ? 'platformTags' : 'gameTags';
    if (!data[store][entityId]) data[store][entityId] = [];
    if (!data[store][entityId].includes(tag)) {
      data[store][entityId].push(tag);
    }
    saveData(data);
    return NextResponse.json({ tags: data[store][entityId] });
  }

  if (action === 'remove_tag') {
    const store = entityType === 'platform' ? 'platformTags' : 'gameTags';
    if (data[store][entityId]) {
      data[store][entityId] = data[store][entityId].filter((t: string) => t !== tag);
    }
    saveData(data);
    return NextResponse.json({ tags: data[store][entityId] || [] });
  }

  if (action === 'add_mention') {
    // mention: { entityId, entityType, fromPerson, toPerson, message, createdAt }
    if (!data.mentions[mention.toPerson]) data.mentions[mention.toPerson] = [];
    const entry = {
      id: Date.now().toString(),
      entityId: mention.entityId,
      entityType: mention.entityType,
      entityName: mention.entityName,
      fromPerson: mention.fromPerson,
      message: mention.message,
      createdAt: new Date().toISOString(),
    };
    data.mentions[mention.toPerson].push(entry);
    saveData(data);
    return NextResponse.json(entry);
  }

  if (action === 'delete_mention') {
    const { personId, mentionId } = body;
    if (data.mentions[personId]) {
      data.mentions[personId] = data.mentions[personId].filter((m: any) => m.id !== mentionId);
    }
    saveData(data);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
