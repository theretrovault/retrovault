import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { getExistingRecordNotice } from '@/lib/fieldPurchaseFlow';

describe('mobile inventory actions', () => {
  const source = fs.readFileSync(path.join(process.cwd(), 'src/app/inventory/page.tsx'), 'utf8');

  it('uses a viewport-fixed mobile action sheet rather than clipping the menu inside the table scroller', () => {
    expect(source).toContain('fixed inset-x-4 bottom-4 z-[100]');
    expect(source).toContain('sm:absolute sm:inset-x-auto sm:bottom-auto sm:right-0 sm:top-full');
    expect(source).toContain('max-h-[calc(100dvh-2rem)]');
    expect(source).toContain('min-h-11 min-w-11');
    expect(source).toContain('aria-haspopup="menu"');
  });

  it('keeps copy cost editing and save controls usable on narrow screens', () => {
    expect(source).toContain('w-full sm:w-[100px]');
    expect(source).toContain('sticky bottom-0');
    expect(source).toContain('inputMode=\"decimal\"');
  });
});

describe('field purchase messaging', () => {
  it('does not imply ownership when only a catalog/price record exists', () => {
    expect(getExistingRecordNotice(0)).toBe(
      'Price data exists for this game, but you do not have an owned copy yet. Bought It will add your first copy to the existing record.',
    );
  });

  it('reports the owned-copy count when another copy will be added', () => {
    expect(getExistingRecordNotice(1)).toBe(
      'You own 1 copy of this game. Bought It will add another copy to the existing record.',
    );
    expect(getExistingRecordNotice(3)).toBe(
      'You own 3 copies of this game. Bought It will add another copy to the existing record.',
    );
  });
});
