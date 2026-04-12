import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import { requireApiAuth, apiResponse, apiError } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { error } = requireApiAuth(req);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const platform  = searchParams.get('platform')?.toLowerCase();
  const owned     = searchParams.get('owned');
  const q         = searchParams.get('q')?.toLowerCase();
  const hasPrice  = searchParams.get('has_price');
  const sortField = searchParams.get('sort') || 'title';
  const limit     = Math.min(parseInt(searchParams.get('limit') || '100'), 1000);
  const offset    = parseInt(searchParams.get('offset') || '0');

  const invPath = path.join(process.cwd(), 'data', 'inventory.json');
  if (!fs.existsSync(invPath)) return apiError('Inventory not found', 404);

  let items = JSON.parse(fs.readFileSync(invPath, 'utf8'));

  // Filters
  if (platform) items = items.filter((i: any) => i.platform?.toLowerCase() === platform);
  if (owned === 'true') items = items.filter((i: any) => (i.copies || []).length > 0);
  if (owned === 'false') items = items.filter((i: any) => (i.copies || []).length === 0);
  if (q) items = items.filter((i: any) => i.title?.toLowerCase().includes(q));
  if (hasPrice === 'true') items = items.filter((i: any) => parseFloat(i.marketLoose || '0') > 0);

  // Sort
  const SORT_FIELDS: Record<string, (a: any, b: any) => number> = {
    title:       (a, b) => (a.title || '').localeCompare(b.title || ''),
    platform:    (a, b) => (a.platform || '').localeCompare(b.platform || ''),
    marketLoose: (a, b) => (parseFloat(b.marketLoose || '0') - parseFloat(a.marketLoose || '0')),
    lastFetched: (a, b) => new Date(b.lastFetched || 0).getTime() - new Date(a.lastFetched || 0).getTime(),
  };
  if (SORT_FIELDS[sortField]) items = [...items].sort(SORT_FIELDS[sortField]);

  const total = items.length;
  const page = items.slice(offset, offset + limit).map((item: any) => ({
    id: item.id,
    title: item.title,
    platform: item.platform,
    copies: item.copies?.length || 0,
    owned: (item.copies || []).length > 0,
    isDigital: item.isDigital || false,
    condition: item.copies?.[0]?.condition || null,
    hasBox: item.copies?.[0]?.hasBox || false,
    hasManual: item.copies?.[0]?.hasManual || false,
    priceAcquired: item.copies?.reduce((s: number, c: any) => s + (parseFloat(c.priceAcquired) || 0), 0) || 0,
    market: {
      loose: parseFloat(item.marketLoose || '0') || null,
      cib: parseFloat(item.marketCib || '0') || null,
      new: parseFloat(item.marketNew || '0') || null,
      graded: parseFloat(item.marketGraded || '0') || null,
    },
    lastFetched: item.lastFetched || null,
    purchaseDate: item.purchaseDate || null,
    source: item.source || null,
    tags: [], // populated from tags.json if needed
  }));

  return apiResponse(page, { total, offset, limit, returned: page.length });
}
