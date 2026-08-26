import { describe, expect, it, vi } from 'vitest'
import { createInventoryAsset, enablePlatformAfterAdd } from '@/lib/inventoryAddFlow'

const asset = { id: 'new-game', title: 'New Game', platform: 'NES', status: 'Yes', copies: [] }

describe('createInventoryAsset', () => {
  it('returns the created game for a successful response', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ...asset, id: 'created-id' }), { status: 201, headers: { 'Content-Type': 'application/json' } }))
    await expect(createInventoryAsset(asset, fetcher)).resolves.toMatchObject({ id: 'created-id', title: 'New Game' })
    expect(fetcher).toHaveBeenCalledWith('/api/inventory', expect.objectContaining({ method: 'POST' }))
  })

  it('rejects a non-2xx response with the API error instead of treating it as a game', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: 'database is locked' }), { status: 500, headers: { 'Content-Type': 'application/json' } }))
    await expect(createInventoryAsset(asset, fetcher)).rejects.toThrow('database is locked')
  })

  it('rejects a malformed success body', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response('<html>not json</html>', { status: 201 }))
    await expect(createInventoryAsset(asset, fetcher)).rejects.toThrow('invalid response')
  })
})

describe('enablePlatformAfterAdd', () => {
  it('enables the platform without starting external catalog population', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
    await expect(enablePlatformAfterAdd('Atari 2600', fetcher, 100)).resolves.toEqual({ ok: true })
    const [, options] = fetcher.mock.calls[0]
    expect(JSON.parse(String(options?.body))).toEqual({ platform: 'Atari 2600', enabled: true, autoPopulate: false })
  })

  it('times out instead of leaving the add flow pending forever', async () => {
    const fetcher = vi.fn((_url: RequestInfo | URL, options?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      options?.signal?.addEventListener('abort', () => reject(options.signal?.reason))
    }))
    const started = Date.now()
    await expect(enablePlatformAfterAdd('Atari 2600', fetcher, 20)).resolves.toMatchObject({ ok: false })
    expect(Date.now() - started).toBeLessThan(500)
  })
})
