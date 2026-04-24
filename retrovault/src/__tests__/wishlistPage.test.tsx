import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';

describe('Wishlist page contextual flow', () => {
  const source = fs.readFileSync(path.join(process.cwd(), 'src/app/wishlist/page.tsx'), 'utf8');

  it('adds wishlist-level price fetch affordances and surfaces saved market prices on cards', () => {
    expect(source).toContain('Fetch Price');
    expect(source).toContain('/api/pricecharting?title=');
    expect(source).toContain('wishlistId?: string');
    expect(source).toContain('onFetchPrice');
    expect(source).toContain('item.marketLoose');
    expect(source).toContain('item.marketCib');
    expect(source).toContain('item.lastFetched');
  });

  it('uses suggestions for contextual title entry, including field cache data and unknown-platform fallback', () => {
    expect(source).toContain('catalogRef');
    expect(source).toContain('pickSuggestion');
    expect(source).toContain('showSuggestions');
    expect(source).toContain('readFieldCache');
    expect(source).toContain("suggestion.platform !== 'Unknown' ? suggestion.platform : form.platform");
  });

  it('prompts before found items disappear, routes them into collection, and ignores catalog-only ownership ghosts', () => {
    expect(source).toContain('FOUND IT?');
    expect(source).toContain('Add to Collection');
    expect(source).toContain('/api/inventory');
    expect(source).toContain('buildFieldCopy');
    expect(source).toContain('item.copies.length > 0');
  });
});
