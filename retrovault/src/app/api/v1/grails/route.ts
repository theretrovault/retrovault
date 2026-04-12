import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import { requireApiAuth, apiResponse } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { error } = requireApiAuth(req);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || 'all';

  const p = path.join(process.cwd(), 'data', 'grails.json');
  let data = fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : [];

  if (status === 'hunting') data = data.filter((g: any) => !g.acquiredAt);
  if (status === 'found') data = data.filter((g: any) => !!g.acquiredAt);

  return apiResponse(data, {
    total: data.length,
    hunting: data.filter((g: any) => !g.acquiredAt).length,
    found: data.filter((g: any) => !!g.acquiredAt).length,
  });
}
