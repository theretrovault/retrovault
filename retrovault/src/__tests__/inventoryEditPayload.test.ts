import { describe, expect, it } from 'vitest'
import { buildEditPayload } from '@/lib/inventoryEditPayload'

describe('buildEditPayload', () => {
  const baseItem = {
    id: 'genesis-battletoads-8fcf10f184',
    title: 'Battletoads',
    platform: 'Sega Genesis',
    status: 'Yes',
    marketLoose: '25.00',
    marketCib: '35.00',
    lastFetched: '2026-08-28T00:00:00.000Z',
  }

  const baseCopies = [
    { id: 'copy-1', condition: 'CIB', hasBox: true, hasManual: true, priceAcquired: '15.00' },
    { id: 'copy-2', condition: 'Loose', hasBox: false, hasManual: false, priceAcquired: '8.00' },
  ]

  it('carries an existing notes value through to the PUT body unchanged', () => {
    const payload = buildEditPayload({ ...baseItem, notes: 'First copy is CIB, second is loose' }, baseCopies)
    expect(payload.notes).toBe('First copy is CIB, second is loose')
    expect(payload.id).toBe(baseItem.id)
    expect(payload.title).toBe(baseItem.title)
    expect(payload.platform).toBe(baseItem.platform)
    expect(payload.status).toBe(baseItem.status)
    expect(payload.copies).toEqual(baseCopies)
  })

  it('normalizes a missing notes value to an empty string instead of undefined', () => {
    const payload = buildEditPayload({ ...baseItem }, baseCopies)
    expect(payload.notes).toBe('')
    expect(payload.notes).toBeDefined()
  })

  it('normalizes an explicit null notes value to an empty string', () => {
    const payload = buildEditPayload({ ...baseItem, notes: null }, baseCopies)
    expect(payload.notes).toBe('')
  })

  it('normalizes an empty-string notes value to an empty string (clearing a note)', () => {
    const payload = buildEditPayload({ ...baseItem, notes: '' }, baseCopies)
    expect(payload.notes).toBe('')
  })

  it('preserves market price and other optional fields on the payload', () => {
    const payload = buildEditPayload(baseItem, baseCopies)
    expect(payload.marketLoose).toBe('25.00')
    expect(payload.marketCib).toBe('35.00')
    expect(payload.lastFetched).toBe('2026-08-28T00:00:00.000Z')
  })

  it('deep-copies the copies array so later mutation of the source does not leak into the payload', () => {
    const mutableCopies = baseCopies.map((copy) => ({ ...copy }))
    const payload = buildEditPayload(baseItem, mutableCopies)
    mutableCopies[0].condition = 'MODIFIED'
    expect(payload.copies[0].condition).toBe('CIB')
  })

  it('builds a payload with an empty copies array when a game has no physical copies', () => {
    const payload = buildEditPayload({ ...baseItem, notes: 'digital-only' }, [])
    expect(payload.copies).toEqual([])
    expect(payload.notes).toBe('digital-only')
  })
})
