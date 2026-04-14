/**
 * Layout Overflow Tests
 *
 * Guards against buttons and UI elements overflowing their container.
 * The specific bug: button rows using `flex gap-X` without `flex-wrap`
 * cause children to overflow on narrow screens / when sidebar is open.
 *
 * Rule: any `flex` container that holds 3+ buttons MUST have `flex-wrap`
 * so children reflow instead of overflow.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const SRC = path.join(process.cwd(), 'src');

function readFile(p: string): string {
  return fs.readFileSync(p, 'utf8');
}

/**
 * Find top-level action button rows that are missing flex-wrap.
 * Focused on page-level header/toolbar rows (4+ full-size action buttons)
 * rather than modal controls, table cells, or inline edit rows.
 *
 * Heuristic:
 * - Flex container at low indentation level (header/toolbar, not deep in modal)
 * - 4+ px-4 py-2 buttons (full-size action buttons, not icon/link buttons)
 * - Missing flex-wrap
 */
function findUnwrappedButtonRows(src: string, filename: string): string[] {
  const issues: string[] = [];
  const lines = src.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const indent = line.match(/^(\s+)/)?.[1]?.length ?? 0;

    // Only check shallowly-indented flex containers (top-level page sections)
    if (indent > 12) continue;

    // Look for flex container divs at page level
    if (!line.includes('className=') || (!line.includes('"flex ') && !line.includes('"flex"'))) continue;

    // Skip patterns that are fine
    if (
      line.includes('flex-wrap') ||
      line.includes('flex-col') ||
      line.includes('flex-1') ||
      line.includes('flex-none') ||
      line.includes('flex items-center') && !line.includes('gap-') ||
      line.includes('justify-between') // two-sided layouts don't need wrap
    ) continue;

    // Count FULL-SIZE action buttons (px-4 py-2, not small icon buttons) in next 25 lines
    let buttonCount = 0;
    let depth = 0;
    for (let j = i; j < Math.min(i + 25, lines.length); j++) {
      const l = lines[j];
      for (const ch of l) { if (ch === '{' || ch === '<') depth++; if (ch === '}' || ch === '>') depth--; }
      // Count buttons that look like main action buttons (have px-4 and py-2)
      if ((l.includes('<button') || l.includes('<Button')) && l.includes('px-4') && l.includes('py-2')) {
        buttonCount++;
      }
    }

    if (buttonCount >= 4) {
      issues.push(`Line ${i + 1}: flex container with ${buttonCount}+ action buttons missing flex-wrap in ${filename}`);
    }
  }

  return issues;
}

// ─── Files to audit ───────────────────────────────────────────────────────────

const PAGES_TO_AUDIT = [
  'app/inventory/page.tsx',
  'app/sales/page.tsx',
  'app/grails/page.tsx',
  'app/wishlist/page.tsx',
  'app/field/page.tsx',
  'app/hotlist/page.tsx',
  'app/scrapers/page.tsx',
  'app/settings/page.tsx',
];

describe('Layout overflow — button rows must use flex-wrap', () => {
  for (const relPath of PAGES_TO_AUDIT) {
    const fullPath = path.join(SRC, relPath);

    it(`${relPath} has no unwrapped button rows that could overflow`, () => {
      if (!fs.existsSync(fullPath)) {
        expect(true).toBe(true);
        return;
      }

      const src = readFile(fullPath);
      const issues = findUnwrappedButtonRows(src, relPath);

      if (issues.length > 0) {
        throw new Error(
          `Layout overflow risk in ${relPath}:\n` +
          issues.map(i => `  - ${i}`).join('\n') +
          '\n\nFix: add flex-wrap to the container className.'
        );
      }

      expect(issues).toHaveLength(0);
    });
  }

  // Specific regression test: inventory header button row
  it('Inventory page header button row uses flex-wrap', () => {
    const src = readFile(path.join(SRC, 'app/inventory/page.tsx'));
    // The header action row must have flex-wrap
    const headerSection = src.match(/<header[^>]*>[\s\S]*?<\/header>/)?.[0] ?? '';
    expect(headerSection).toContain('flex-wrap');
  });

  it('Inventory Add Asset button has whitespace-nowrap', () => {
    const src = readFile(path.join(SRC, 'app/inventory/page.tsx'));
    // The Add Asset button should not overflow — ensure whitespace-nowrap is set
    const addAssetBtn = src.match(/\+ ADD ASSET[\s\S]{0,50}/)?.[0] ?? '';
    // Check the button's className context has whitespace-nowrap
    const btnContext = src.match(/onClick={openNew}[^>]*className="[^"]*"/)?.[0] ?? '';
    expect(btnContext).toContain('whitespace-nowrap');
  });
});
