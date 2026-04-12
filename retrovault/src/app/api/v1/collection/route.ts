import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import { requireApiAuth, apiResponse, apiError } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { error } = requireApiAuth(req);
  if (error) return error;

  try {
    const read = (f: string, fb: any = []) => {
      const p = path.join(process.cwd(), 'data', f);
      if (!fs.existsSync(p)) return fb;
      return JSON.parse(fs.readFileSync(p, 'utf8'));
    };

    const inventory = read('inventory.json');
    const sales = read('sales.json', { sales: [], acquisitions: [] });
    const grails = read('grails.json');
    const playlog = read('playlog.json');
    const watchlist = read('watchlist.json');

    const owned = inventory.filter((i: any) => (i.copies || []).length > 0 && !i.isDigital);
    const totalValue = owned.reduce((s: number, i: any) => s + (parseFloat(i.marketLoose || '0') || 0), 0);
    const totalCib   = owned.reduce((s: number, i: any) => s + (parseFloat(i.marketCib || '0') || parseFloat(i.marketLoose || '0') || 0), 0);
    const totalPaid  = owned.reduce((s: number, i: any) =>
      s + (i.copies || []).reduce((cs: number, c: any) => cs + (parseFloat(c.priceAcquired) || 0), 0), 0);
    const platforms = [...new Set(owned.map((i: any) => i.platform))];
    const saleRevenue = (sales.sales || []).reduce((s: number, sl: any) => s + (parseFloat(sl.salePrice) || 0), 0);

    return apiResponse({
      games: {
        total: inventory.length,
        owned: owned.length,
        platforms: platforms.length,
        digital: inventory.filter((i: any) => i.isDigital && (i.copies || []).length > 0).length,
      },
      value: {
        loose: Math.round(totalValue * 100) / 100,
        cib: Math.round(totalCib * 100) / 100,
        paid: Math.round(totalPaid * 100) / 100,
        unrealizedGain: Math.round((totalValue - totalPaid) * 100) / 100,
      },
      business: {
        totalSales: (sales.sales || []).length,
        saleRevenue: Math.round(saleRevenue * 100) / 100,
        totalProfit: Math.round((saleRevenue - totalPaid) * 100) / 100,
      },
      hunting: {
        grailsActive: grails.filter((g: any) => !g.acquiredAt).length,
        grailsFound: grails.filter((g: any) => !!g.acquiredAt).length,
        watchlistItems: watchlist.length,
      },
      personal: {
        playlogGames: playlog.length,
        gamesBeaten: playlog.filter((p: any) => p.status === 'beat').length,
        currentlyPlaying: playlog.filter((p: any) => p.status === 'playing').length,
        backlog: playlog.filter((p: any) => p.status === 'backlog').length,
      },
      platforms,
    });
  } catch (e: any) {
    return apiError(e.message || 'Failed to compute collection stats', 500);
  }
}
