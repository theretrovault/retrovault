import { describe, it, expect } from 'vitest';
import {
  findInventoryMatch,
  getCopyFlags,
  buildAcquisitionEntry,
} from '@/lib/fieldMode';

describe('Field Mode helpers', () => {
  it('finds an existing inventory match case-insensitively', () => {
    const items = [
      { title: 'Wii Sports', platform: 'Wii', copies: [] },
      { title: 'F-Zero', platform: 'SNES', copies: [] },
    ];

    const found = findInventoryMatch(items, 'wii sports', 'wii');
    expect(found?.title).toBe('Wii Sports');
  });

  it('returns undefined when the title/platform pair does not exist', () => {
    const items = [{ title: 'Wii Sports', platform: 'Wii' }];
    expect(findInventoryMatch(items, 'Wii Play', 'Wii')).toBeUndefined();
  });

  it('maps CIB to box + manual', () => {
    expect(getCopyFlags('CIB')).toEqual({ hasBox: true, hasManual: true });
  });

  it('maps Loose to no box or manual', () => {
    expect(getCopyFlags('Loose')).toEqual({ hasBox: false, hasManual: false });
  });

  it('builds acquisition entries for Field Mode purchases', () => {
    const entry = buildAcquisitionEntry({
      title: 'Wii Sports',
      platform: 'Wii',
      priceAcquired: '8.00',
    });

    expect(entry).toMatchObject({
      title: 'Wii Sports',
      platform: 'Wii',
      source: 'Field Mode',
      cost: '8.00',
      notes: 'Logged from Field Mode',
    });
    expect(entry.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
