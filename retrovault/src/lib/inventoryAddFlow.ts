export type InventoryAsset = {
  id: string
  title: string
  platform: string
  [key: string]: unknown
}

type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

async function readJson(response: Response): Promise<Record<string, unknown> | null> {
  try {
    const body = await response.json()
    return body && typeof body === 'object' ? body as Record<string, unknown> : null
  } catch {
    return null
  }
}

export async function createInventoryAsset<T extends InventoryAsset>(
  item: T,
  fetcher: Fetcher = fetch,
): Promise<T> {
  const response = await fetcher('/api/inventory', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  })
  const body = await readJson(response)

  if (!response.ok) {
    const apiError = typeof body?.error === 'string' ? body.error : null
    throw new Error(apiError || `Failed to add game (HTTP ${response.status})`)
  }

  if (!body || typeof body.id !== 'string' || typeof body.title !== 'string' || typeof body.platform !== 'string') {
    throw new Error('Failed to add game: invalid response from inventory API')
  }

  return body as T
}

export type PlatformEnableResult = { ok: true } | { ok: false; error: string }

export async function enablePlatformAfterAdd(
  platform: string,
  fetcher: Fetcher = fetch,
  timeoutMs = 5000,
): Promise<PlatformEnableResult> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(new Error('Platform enable timed out')), timeoutMs)

  try {
    const response = await fetcher('/api/platforms/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform, enabled: true, autoPopulate: false }),
      signal: controller.signal,
    })
    const body = await readJson(response)
    if (!response.ok) {
      return { ok: false, error: typeof body?.error === 'string' ? body.error : `HTTP ${response.status}` }
    }
    return { ok: true }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Platform enable failed' }
  } finally {
    clearTimeout(timeout)
  }
}
