import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'data', 'favorites.json');

function getData() {
  if (!fs.existsSync(filePath)) return { people: [], favorites: {}, regrets: {} };
  const d = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (!d.regrets) d.regrets = {};
  return d;
}
function saveData(data: any) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

export async function GET() {
  return NextResponse.json(getData());
}

export async function POST(req: Request) {
  const body = await req.json();
  const data = getData();

  // Add a new person
  if (body.action === 'add_person') {
    const newPerson = { id: Date.now().toString(), name: body.name.trim() };
    data.people.push(newPerson);
    data.favorites[newPerson.id] = [];
    data.regrets[newPerson.id] = [];
    saveData(data);
    return NextResponse.json(newPerson);
  }

  // Rename person
  if (body.action === 'rename_person') {
    const person = data.people.find((p: any) => p.id === body.id);
    if (!person) return NextResponse.json({ error: 'Person not found' }, { status: 404 });
    person.name = body.name.trim();
    saveData(data);
    return NextResponse.json(person);
  }

  // Remove person
  if (body.action === 'remove_person') {
    data.people = data.people.filter((p: any) => p.id !== body.id);
    delete data.favorites[body.id];
    delete data.regrets[body.id];
    saveData(data);
    return NextResponse.json({ ok: true });
  }

  // Toggle favorite for a person + game
  if (body.action === 'toggle_favorite') {
    const { personId, gameId } = body;
    if (!data.favorites[personId]) data.favorites[personId] = [];
    const list: string[] = data.favorites[personId];
    const idx = list.indexOf(gameId);
    if (idx === -1) {
      list.push(gameId);
      // Remove from regrets if it's there
      if (data.regrets[personId]) {
        data.regrets[personId] = data.regrets[personId].filter((id: string) => id !== gameId);
      }
    }
    else list.splice(idx, 1);
    saveData(data);
    return NextResponse.json({ favorites: data.favorites[personId] });
  }

  // Toggle regret for a person + game
  if (body.action === 'toggle_regret') {
    const { personId, gameId } = body;
    if (!data.regrets[personId]) data.regrets[personId] = [];
    const list: string[] = data.regrets[personId];
    const idx = list.indexOf(gameId);
    if (idx === -1) {
      list.push(gameId);
      // Remove from favorites if it's there
      if (data.favorites[personId]) {
        data.favorites[personId] = data.favorites[personId].filter((id: string) => id !== gameId);
      }
    }
    else list.splice(idx, 1);
    saveData(data);
    return NextResponse.json({ regrets: data.regrets[personId] });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
