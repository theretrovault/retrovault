import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import { requireApiAuth, apiResponse } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { error } = requireApiAuth(req);
  if (error) return error;

  const p = path.join(process.cwd(), 'data', 'watchlist.json');
  const data = fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : [];
  
  const invPath = path.join(process.cwd(), 'data', 'inventory.json');
  const inventory = fs.existsSync(invPath) ? JSON.parse(fs.readFileSync(invPath, 'utf8')) : [];
  const invMap = Object.fromEntries(inventory.map((i: any) => [i.id, i]));

  const enriched = data.map((item: any) => {
    const inv = invMap[item.id];
    const market = inv ? parseFloat(inv.marketLoose || '0') : 0;
    const target = parseFloat(item.alertPrice || '0');
    return {
      ...item,
      currentPrice: market || null,
      alertTriggered: market > 0 && target > 0 && market <= target,
      priceDifference: market > 0 && target > 0 ? Math.round((market - target) * 100) / 100 : null,
    };
  });

  const alerts = enriched.filter((i: any) => i.alertTriggered);
  return apiResponse(enriched, { total: enriched.length, alertsTriggered: alerts.length });
}
