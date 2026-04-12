import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import { requireApiAuth, apiResponse, apiError } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { error } = requireApiAuth(req);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const type   = searchParams.get('type') || 'both';
  const limit  = Math.min(parseInt(searchParams.get('limit') || '100'), 1000);
  const offset = parseInt(searchParams.get('offset') || '0');

  const p = path.join(process.cwd(), 'data', 'sales.json');
  if (!fs.existsSync(p)) return apiResponse({ sales: [], acquisitions: [] });

  const data = JSON.parse(fs.readFileSync(p, 'utf8'));
  const sales = (data.sales || []).slice(offset, offset + limit);
  const acquisitions = (data.acquisitions || []).slice(offset, offset + limit);

  const result: any = {};
  if (type === 'sales' || type === 'both') result.sales = sales;
  if (type === 'acquisitions' || type === 'both') result.acquisitions = acquisitions;

  const saleRevenue = (data.sales || []).reduce((s: number, sl: any) => s + (parseFloat(sl.salePrice) || 0), 0);
  const totalCost = (data.acquisitions || []).reduce((s: number, a: any) => s + (parseFloat(a.cost) || 0), 0);

  return apiResponse(result, {
    totals: {
      salesCount: data.sales?.length || 0,
      acquisitionsCount: data.acquisitions?.length || 0,
      revenue: Math.round(saleRevenue * 100) / 100,
      spent: Math.round(totalCost * 100) / 100,
      profit: Math.round((saleRevenue - totalCost) * 100) / 100,
    }
  });
}
