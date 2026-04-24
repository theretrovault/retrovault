import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';

describe('Wishlist page contextual flow', () => {
  const source = fs.readFileSync(path.join(process.cwd(), 'src/app/wishlist/page.tsx'), 'utf8');

  it('adds wishlist-level and bulk price fetch affordances, with visual refresh hooks', () => {
    expect(source).toContain('Fetch Price');
    expect(source).toContain('Fetch All');
    expect(source).toContain('fetchAllPrices');
    expect(source).toContain('wishlistId?: string');
    expect(source).toContain('fetchingWishlistIds');
    expect(source).toContain('isFetchingPrice');
    expect(source).toContain('setItems((current) => current.map');
    expect(source).toContain('item.marketLoose');
    expect(source).toContain('item.marketCib');
    expect(source).toContain('item.lastFetched');
  });

  it('adds wishlist QR share parity and a direct PriceCharting link on cards', () => {
    expect(source).toContain('generateShareQr');
    expect(source).toContain('shareQrSvg');
    expect(source).toContain('Download QR');
    expect(source).toContain('PriceCharting');
    expect(source).toContain('buildPriceChartingUrl');
    expect(source).toContain('search-products?');
  });

  it('fully dismisses wishlist share UI state', () => {
    expect(source).toContain('setShareUrl(null); setShareQrSvg(""); setCopyMsg("")');
  });

  it('handles wishlist share failures honestly instead of silently failing', () => {
    expect(source).toContain('Could not generate wishlist share link');
    expect(source).toContain('Share link failed');
    expect(source).toContain('!shareUrl && copyMsg');
  });

  it('uses suggestions for contextual title entry while keeping unknown platforms truthful', () => {
    expect(source).toContain('catalogRef');
    expect(source).toContain('pickSuggestion');
    expect(source).toContain('showSuggestions');
    expect(source).toContain('readFieldCache');
    expect(source).toContain('Platform unknown');
  });

  it('sorts wishlist items by platform and then title', () => {
    expect(source).toContain('const compareWishlistItems');
    expect(source).toContain('a.platform.localeCompare(b.platform');
    expect(source).toContain('a.title.localeCompare(b.title');
    expect(source).toContain('const sortedFiltered = [...filtered].sort(compareWishlistItems)');
  });

  it('prompts before found items disappear, routes them into collection, and ignores catalog-only ownership ghosts', () => {
    expect(source).toContain('FOUND IT?');
    expect(source).toContain('Add to Collection');
    expect(source).toContain('/api/inventory');
    expect(source).toContain('buildFieldCopy');
    expect(source).toContain('item.copies.length > 0');
  });
});
