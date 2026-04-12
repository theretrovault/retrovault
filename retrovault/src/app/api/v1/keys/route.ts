import { NextRequest } from 'next/server';
import { requireApiAuth, apiResponse, apiError, getApiKeys, addApiKey, revokeApiKey } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { error } = requireApiAuth(req, true); // write key required
  if (error) return error;

  const keys = getApiKeys().map(k => ({
    id: k.id,
    name: k.name,
    prefix: k.prefix,
    permissions: k.permissions,
    createdAt: k.createdAt,
    lastUsed: k.lastUsed || null,
  }));

  return apiResponse(keys, { total: keys.length });
}

export async function POST(req: NextRequest) {
  const { error } = requireApiAuth(req, true);
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  const { name, permissions = 'read' } = body;

  if (!name || name.trim().length < 2) return apiError('Name must be at least 2 characters.');
  if (!['read', 'write'].includes(permissions)) return apiError('Permissions must be "read" or "write".');

  const { key, record } = addApiKey(name.trim(), permissions);
  return apiResponse({ key, ...record }, { warning: 'Store this key securely — it will not be shown again.' });
}

export async function DELETE(req: NextRequest) {
  const { error } = requireApiAuth(req, true);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return apiError('id query parameter required.');

  const success = revokeApiKey(id);
  if (!success) return apiError('Key not found.', 404);
  return apiResponse({ revoked: true, id });
}
