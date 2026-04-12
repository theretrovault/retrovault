import { NextRequest } from 'next/server';
import { requireApiAuth, apiResponse } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { error } = requireApiAuth(req);
  if (error) return error;

  const baseUrl = req.nextUrl.origin;
  const health = await fetch(`${baseUrl}/api/health`, { cache: 'no-store' }).then(r => r.json()).catch(() => null);
  return apiResponse(health);
}
