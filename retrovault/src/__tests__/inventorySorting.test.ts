import { describe, expect, it } from 'vitest';
import fs from 'fs';

const PAGE = '/home/apesch/.openclaw/workspace/retrovault/src/app/inventory/page.tsx';

describe('inventory sorting UX', () => {
  const src = fs.readFileSync(PAGE, 'utf8');

  it('defaults vault sorting to newest date added first', () => {
    expect(src).toContain('useState<string>("dateAdded")');
    expect(src).toContain('useState<"asc" | "desc">("desc")');
    expect(src).toContain('SORT: DATE ADDED (NEWEST)');
  });

  it('offers explicit sort controls for date added and game age', () => {
    expect(src).toContain('value={`${sortField}:${sortOrder}`}');
    expect(src).toContain('SORT: DATE ADDED (OLDEST)');
    expect(src).toContain('SORT: GAME AGE (OLDEST)');
    expect(src).toContain('SORT: GAME AGE (NEWEST)');
  });
});
