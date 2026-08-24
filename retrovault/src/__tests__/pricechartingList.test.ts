import { describe, expect, it } from 'vitest';
import path from 'path';
import { pathToFileURL } from 'url';

const moduleUrl = pathToFileURL(path.join(process.cwd(), 'scripts/lib/pricecharting-list.mjs')).href;

describe('PriceCharting list pages', () => {
  it('builds current console-route URLs and parses fixture game rows', async () => {
    const { buildConsoleUrl, parseGameRows } = await import(moduleUrl);
    expect(buildConsoleUrl('nes', { sort: 'title' })).toBe('https://www.pricecharting.com/console/nes?sort=title');
    const html = `<table id="games_table"><tbody>
      <tr><td class="title"><a href="/game/nes/legend-of-zelda">Legend of Zelda</a></td><td class="js-price">$35.00</td><td class="js-price">$180.00</td><td class="js-price">$244.64</td></tr>
    </tbody></table>`;
    expect(parseGameRows(html)).toEqual([{ title: 'Legend of Zelda', href: '/game/nes/legend-of-zelda', loose: 35, cib: 180, new: 244.64 }]);
  });

  it('matches explicitly requested platform names instead of substrings', async () => {
    const { selectPlatforms } = await import(moduleUrl);
    const platforms = [{ name: 'NES', slug: 'nes' }, { name: 'SNES', slug: 'super-nintendo' }, { name: 'Sega Genesis', slug: 'sega-genesis' }];
    expect(selectPlatforms(platforms, ['NES'])).toEqual([{ name: 'NES', slug: 'nes' }]);
  });
});
