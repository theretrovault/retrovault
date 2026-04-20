import { describe, expect, it } from 'vitest';
import fs from 'fs';

const PAGE = '/home/apesch/.openclaw/workspace/retrovault/src/app/steam/page.tsx';
const LIB = '/home/apesch/.openclaw/workspace/retrovault/src/lib/steam.ts';
const SEARCH = '/home/apesch/.openclaw/workspace/retrovault/src/components/GlobalSearch.tsx';

describe('steam connector groundwork', () => {
  const page = fs.readFileSync(PAGE, 'utf8');
  const lib = fs.readFileSync(LIB, 'utf8');
  const search = fs.readFileSync(SEARCH, 'utf8');

  it('provides first-pass steam profile parsing and privacy guidance', () => {
    expect(lib).toContain('export function parseSteamInput');
    expect(lib).toContain('steamcommunity.com/profiles/');
    expect(lib).toContain('steamcommunity.com/id/');
    expect(page).toContain('Privacy Workflow');
    expect(page).toContain('Prepare Import Target');
    expect(page).toContain('Owned Games Mapping Preview');
    expect(page).toContain('Preview Owned Games Mapping');
  });

  it('makes the steam connector discoverable in global search', () => {
    expect(search).toContain('p-steam');
    expect(search).toContain('Steam Connector');
    expect(search).toContain('/steam');
  });
});
