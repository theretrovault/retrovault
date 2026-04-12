import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const filePath = path.join(process.cwd(), 'data', 'app.config.json');

const DEFAULTS = {
  appName: "RetroVault",
  tagline: "Your Retro Gaming Collection Engine",
  ownerName: "",
  themeColor: "green",
  currency: "$",
  dateFormat: "US",
  publicUrl: "",
  standaloneMode: true,
  auth: { enabled: false, passwordHash: "" },
  plex: { url: "https://YYY.YYY.YYY.YYY:PPPPP", token: "" },
  fetchScheduleHour: 0,
  priceDataSource: "pricecharting"
};

function getConfig() {
  if (!fs.existsSync(filePath)) return DEFAULTS;
  return { ...DEFAULTS, ...JSON.parse(fs.readFileSync(filePath, 'utf8')) };
}

function saveConfig(data: any) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

export async function GET() {
  const config = getConfig();
  // Never expose password hash
  const safe = { ...config, auth: { ...config.auth, passwordHash: config.auth?.passwordHash ? '(set)' : '' } };
  return NextResponse.json(safe, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: Request) {
  const body = await req.json();
  const config = getConfig();

  // Handle password update specially
  if (body.newPassword !== undefined) {
    if (body.newPassword === '') {
      config.auth.passwordHash = '';
    } else {
      config.auth.passwordHash = crypto.createHash('sha256').update(body.newPassword).digest('hex');
    }
    delete body.newPassword;
  }

  const updated = { ...config, ...body };
  // Merge nested objects
  if (body.auth) updated.auth = { ...config.auth, ...body.auth };
  if (body.plex) updated.plex = { ...config.plex, ...body.plex };

  saveConfig(updated);
  return NextResponse.json({ ok: true });
}

export async function PUT(req: Request) {
  const { password } = await req.json();
  const config = getConfig();
  if (!config.auth?.enabled) return NextResponse.json({ valid: true });
  if (!password) return NextResponse.json({ valid: false }, { status: 401 });
  const hash = crypto.createHash('sha256').update(password).digest('hex');
  const valid = hash === config.auth.passwordHash;
  return NextResponse.json({ valid }, { status: valid ? 200 : 401 });
}
