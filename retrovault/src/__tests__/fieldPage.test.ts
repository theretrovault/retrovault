import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';

describe('Field page actions', () => {
  const source = fs.readFileSync(path.join(process.cwd(), 'src/app/field/page.tsx'), 'utf8');

  it('supports adding search results directly to the wishlist with player targeting', () => {
    expect(source).toContain('const saveToWishlist = async');
    expect(source).toContain("fetch('/api/wishlist'");
    expect(source).toContain('Added from Field Mode');
    expect(source).toContain('🎁 Add to Wishlist');
    expect(source).toContain('Wishlist Player:');
    expect(source).toContain('playerId: wishlistPlayerId || null');
  });
});
