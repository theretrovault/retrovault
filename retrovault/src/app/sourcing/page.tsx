"use client";
import { useState, useEffect } from "react";
import { getTotalPaid } from "@/lib/marketUtils";

type GameItem = {
  id: string; title: string; platform: string; isDigital?: boolean;
  copies: { priceAcquired: string; id: string }[];
  marketLoose?: string; source?: string; purchaseDate?: string;
};

const SOURCE_COLORS: Record<string, string> = {
  "Garage Sale": "text-green-400 border-green-800",
  "Thrift Store": "text-emerald-400 border-emerald-800",
  "eBay": "text-blue-400 border-blue-800",
  "Facebook Marketplace": "text-blue-300 border-blue-900",
  "Craigslist": "text-purple-400 border-purple-800",
  "Game Store": "text-red-400 border-red-800",
  "Convention": "text-yellow-400 border-yellow-800",
  "Trade": "text-orange-400 border-orange-800",
  "Lot Purchase": "text-cyan-400 border-cyan-800",
  "Whatnot": "text-pink-400 border-pink-800",
  "Gift": "text-rose-400 border-rose-800",
  "r/gameswap": "text-orange-300 border-orange-900",
};

function getColor(src: string) {
  return SOURCE_COLORS[src] || "text-zinc-400 border-zinc-700";
}

export default function SourcingPage() {
  const [items, setItems] = useState<GameItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/inventory").then(r => r.json()).then((d: GameItem[]) => {
      setItems(d.filter(i => (i.copies || []).length > 0 && !i.isDigital));
      setLoading(false);
    });
  }, []);

  // Build source stats
  const sourceMap: Record<string, { count: number; totalPaid: number; totalMarket: number; items: GameItem[] }> = {};
  for (const item of items) {
    const src = item.source?.trim() || "Unknown";
    if (!sourceMap[src]) sourceMap[src] = { count: 0, totalPaid: 0, totalMarket: 0, items: [] };
    const paid = getTotalPaid(item.copies || []);
    const market = parseFloat(item.marketLoose || "0") || 0;
    sourceMap[src].count++;
    sourceMap[src].totalPaid += paid;
    sourceMap[src].totalMarket += market;
    sourceMap[src].items.push(item);
  }

  const sources = Object.entries(sourceMap)
    .map(([src, data]) => {
      const profit = data.totalMarket - data.totalPaid;
      const roi = data.totalPaid > 0 ? (profit / data.totalPaid) * 100 : 0;
      const avgPaid = data.count > 0 ? data.totalPaid / data.count : 0;
      return { src, ...data, profit, roi, avgPaid };
    })
    .sort((a, b) => b.roi - a.roi);

  const totalItems = items.length;
  const bestSource = sources[0];
  const fmt = (n: number) => `$${n.toFixed(2)}`;
  const fmtK = (n: number) => n >= 1000 ? `$${(n/1000).toFixed(1)}k` : fmt(n);

  return (
    <div className="w-full bg-black border-4 border-green-500 rounded p-6 shadow-[0_0_15px_rgba(34,197,94,0.3)] min-h-[80vh]">
      <div className="border-b-4 border-green-900 pb-6 mb-6">
        <h2 className="text-2xl sm:text-3xl text-green-400 tracking-widest uppercase font-terminal">📍 Sourcing Analytics</h2>
        <p className="text-zinc-500 font-terminal text-sm mt-1">Which sources give you the best margins?</p>
      </div>

      {loading ? (
        <div className="text-green-500 font-terminal animate-pulse text-xl text-center py-12">ANALYZING SOURCES...</div>
      ) : sources.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-zinc-800">
          <p className="text-zinc-600 font-terminal text-xl mb-2">No sourcing data yet.</p>
          <p className="text-zinc-700 font-terminal text-sm">Add sources when logging acquisitions in the Vault.</p>
        </div>
      ) : (
        <>
          {/* Summary KPIs */}
          {bestSource && (
            <div className="bg-green-950/20 border-2 border-green-700 p-4 mb-6 flex flex-wrap gap-6">
              <div className="text-center">
                <div className="text-green-400 font-terminal text-3xl font-bold">{bestSource.src}</div>
                <div className="text-zinc-500 font-terminal text-xs">Best source by ROI</div>
              </div>
              <div className="text-center">
                <div className="text-emerald-400 font-terminal text-3xl font-bold">{bestSource.roi.toFixed(0)}%</div>
                <div className="text-zinc-500 font-terminal text-xs">avg ROI</div>
              </div>
              <div className="text-center">
                <div className="text-blue-400 font-terminal text-3xl font-bold">{bestSource.count}</div>
                <div className="text-zinc-500 font-terminal text-xs">games from this source</div>
              </div>
              <div className="text-center">
                <div className="text-yellow-400 font-terminal text-3xl font-bold">{fmt(bestSource.avgPaid)}</div>
                <div className="text-zinc-500 font-terminal text-xs">avg cost per game</div>
              </div>
            </div>
          )}

          {/* Source breakdown table */}
          <div className="overflow-x-auto mb-6">
            <table className="w-full font-terminal text-sm">
              <thead>
                <tr className="border-b-2 border-green-900 text-zinc-500 uppercase text-xs">
                  <th className="text-left p-3">Source</th>
                  <th className="text-right p-3">Games</th>
                  <th className="text-right p-3">Total Paid</th>
                  <th className="text-right p-3">Market Value</th>
                  <th className="text-right p-3">Unrealized Gain</th>
                  <th className="text-right p-3">ROI</th>
                  <th className="text-right p-3">Avg/Game</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((s, i) => {
                  const [textC, borderC] = getColor(s.src).split(' ');
                  return (
                    <tr key={s.src} className={`border-b border-zinc-900 hover:bg-zinc-900/30 transition-colors ${i === 0 ? 'bg-green-950/10' : ''}`}>
                      <td className="p-3">
                        <span className={`font-terminal text-sm px-2 py-0.5 border ${textC} ${borderC}`}>{s.src}</span>
                      </td>
                      <td className="p-3 text-right text-zinc-400">{s.count}</td>
                      <td className="p-3 text-right text-zinc-400">{fmtK(s.totalPaid)}</td>
                      <td className="p-3 text-right text-blue-400">{fmtK(s.totalMarket)}</td>
                      <td className={`p-3 text-right font-bold ${s.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{fmtK(s.profit)}</td>
                      <td className={`p-3 text-right font-bold ${s.roi >= 50 ? 'text-emerald-400' : s.roi >= 20 ? 'text-green-400' : s.roi >= 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {s.roi.toFixed(0)}%
                      </td>
                      <td className="p-3 text-right text-zinc-500">{fmt(s.avgPaid)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Visual bar comparison */}
          <div>
            <h3 className="text-zinc-400 font-terminal text-lg uppercase mb-4">ROI by Source</h3>
            <div className="space-y-2">
              {sources.map(s => {
                const [textC] = getColor(s.src).split(' ');
                const maxRoi = Math.max(...sources.map(x => Math.abs(x.roi)), 1);
                const width = Math.min(Math.abs(s.roi) / maxRoi * 100, 100);
                return (
                  <div key={s.src} className="flex items-center gap-3">
                    <div className="w-36 text-right shrink-0">
                      <span className={`font-terminal text-xs ${textC}`}>{s.src}</span>
                    </div>
                    <div className="flex-1 bg-zinc-900 h-5 relative overflow-hidden">
                      <div className={`h-full transition-all duration-500 ${s.roi >= 0 ? 'bg-green-600' : 'bg-red-800'}`}
                        style={{ width: `${width}%` }} />
                    </div>
                    <div className={`w-16 shrink-0 font-terminal text-sm text-right ${s.roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {s.roi.toFixed(0)}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
