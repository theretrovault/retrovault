"use client";

import { useState, useEffect, useRef } from "react";

type PriceResult = {
  title: string;
  platform: string;
  loose: string | null;
  cib: string | null;
  newPrice: string | null;
  source: "inventory" | "pricecharting";
  owned: number;
  watchlisted: boolean;
  watchlistPrice?: string;
};

type OwnedItem = {
  id: string;
  title: string;
  platform: string;
  copies: { id: string }[];
  marketLoose?: string;
  marketCib?: string;
  marketNew?: string;
};

type WatchlistItem = {
  id: string;
  title: string;
  platform: string;
  alertPrice: string;
};

const MARGIN_THRESHOLD = 30; // % profit margin to recommend BUY

function getDecision(askPrice: number, loosePrice: number | null, ownedCount: number, watchlisted: boolean): {
  verdict: "BUY" | "PASS" | "NEGOTIATE" | "ALREADY OWNED";
  color: string;
  reason: string;
} {
  if (ownedCount >= 2) return { verdict: "ALREADY OWNED", color: "text-orange-400", reason: `You own ${ownedCount} copies. Sell one first.` };
  if (!loosePrice) return { verdict: "NEGOTIATE", color: "text-yellow-400", reason: "No price data. Trust your gut." };

  const margin = ((loosePrice - askPrice) / askPrice) * 100;

  if (watchlisted) return { verdict: "BUY", color: "text-emerald-400", reason: `On your watchlist! Market: $${loosePrice.toFixed(2)}` };
  if (margin >= MARGIN_THRESHOLD) return { verdict: "BUY", color: "text-emerald-400", reason: `${margin.toFixed(0)}% margin. Good deal.` };
  if (margin >= 10) return { verdict: "NEGOTIATE", color: "text-yellow-400", reason: `Thin margin (${margin.toFixed(0)}%). Try to haggle.` };
  if (margin >= 0) return { verdict: "PASS", color: "text-red-400", reason: `Only ${margin.toFixed(0)}% margin. Not worth it.` };
  return { verdict: "PASS", color: "text-red-400", reason: `Overpriced by ${Math.abs(margin).toFixed(0)}%.` };
}

export default function FieldPage() {
  const [query, setQuery] = useState("");
  const [platform, setPlatform] = useState("all");
  const [askPrice, setAskPrice] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<PriceResult[]>([]);
  const [inventory, setInventory] = useState<OwnedItem[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    // Load inventory and watchlist for dupe detection + watchlist check
    fetch("/api/inventory").then(r => r.json()).then((d: OwnedItem[]) => {
      setInventory(d);
      const plats = Array.from(new Set(d.map(i => i.platform))).sort();
      setPlatforms(plats);
    }).catch(() => {});
    fetch("/api/sales?type=watchlist").then(r => r.json()).then(d => {
      if (Array.isArray(d)) setWatchlist(d);
    }).catch(() => {});
  }, []);

  const search = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setResults([]);

    // First check own inventory
    const q = query.toLowerCase();
    const owned = inventory.filter(i =>
      i.title.toLowerCase().includes(q) &&
      (platform === "all" || i.platform === platform)
    );

    if (owned.length > 0) {
      const fromInventory: PriceResult[] = owned.slice(0, 5).map(i => ({
        title: i.title,
        platform: i.platform,
        loose: i.marketLoose || null,
        cib: i.marketCib || null,
        newPrice: i.marketNew || null,
        source: "inventory",
        owned: (i.copies || []).length,
        watchlisted: watchlist.some(w => w.id === i.id),
        watchlistPrice: watchlist.find(w => w.id === i.id)?.alertPrice,
      }));
      setResults(fromInventory);
      setSearching(false);
      return;
    }

    // Fall back to PriceCharting lookup
    try {
      const plat = platform !== "all" ? platform : "";
      const res = await fetch(`/api/pricecharting?title=${encodeURIComponent(query)}&platform=${encodeURIComponent(plat)}`);
      const d = await res.json();
      if (d && d.title) {
        setResults([{
          title: d.title,
          platform: d.platform || plat || "Unknown",
          loose: d.loose || null,
          cib: d.cib || null,
          newPrice: d.new || null,
          source: "pricecharting",
          owned: 0,
          watchlisted: false,
        }]);
      }
    } catch {
      // no result
    }
    setSearching(false);
  };

  const askNum = parseFloat(askPrice);
  const hasAsk = !isNaN(askNum) && askNum > 0;

  return (
    <div className="min-h-screen bg-black p-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="font-terminal text-3xl text-green-400 uppercase tracking-widest mb-1">🔦 Field Mode</h1>
        <p className="text-zinc-600 font-terminal text-sm">Quick price check · Dupe alert · Should I buy?</p>
      </div>

      {/* Search */}
      <div className="space-y-3 mb-6">
        <input ref={inputRef} type="text" value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") search(); }}
          placeholder="GAME TITLE..."
          className="w-full bg-zinc-950 border-2 border-green-800 text-green-300 font-terminal text-2xl p-4 uppercase focus:outline-none focus:border-green-500 placeholder-green-900"
        />
        <div className="flex gap-2">
          <select value={platform} onChange={e => setPlatform(e.target.value)}
            className="flex-1 bg-zinc-950 border-2 border-green-900 text-green-400 font-terminal text-xl p-3 focus:outline-none cursor-pointer">
            <option value="all">ALL PLATFORMS</option>
            {platforms.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <button onClick={search} disabled={searching || !query.trim()}
            className="px-6 py-3 bg-green-600 hover:bg-green-500 text-black font-terminal text-xl font-bold border-2 border-green-400 disabled:opacity-40 transition-colors">
            {searching ? "..." : "SEARCH"}
          </button>
        </div>

        {/* Ask Price */}
        <div className="flex gap-2 items-center">
          <span className="text-zinc-500 font-terminal text-sm uppercase">Their Ask:</span>
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600 font-terminal text-xl">$</span>
            <input type="number" min="0" step="0.50" value={askPrice}
              onChange={e => setAskPrice(e.target.value)}
              placeholder="0.00"
              className="w-full bg-zinc-950 border-2 border-yellow-900 text-yellow-300 font-terminal text-2xl pl-8 p-3 focus:outline-none focus:border-yellow-500"
            />
          </div>
        </div>
      </div>

      {/* Results */}
      {results.length > 0 && results.map((r, i) => {
        const looseNum = r.loose ? parseFloat(r.loose) : null;
        const decision = hasAsk ? getDecision(askNum, looseNum, r.owned, r.watchlisted) : null;

        return (
          <div key={i} className={`bg-zinc-950 border-2 mb-4 p-5 space-y-4 ${
            decision?.verdict === "BUY" ? "border-emerald-700 shadow-[0_0_15px_rgba(16,185,129,0.2)]" :
            decision?.verdict === "PASS" ? "border-red-900" :
            decision?.verdict === "ALREADY OWNED" ? "border-orange-700" :
            "border-green-900"
          }`}>
            {/* Title + platform */}
            <div>
              <h2 className="text-green-300 font-terminal text-2xl uppercase leading-tight">{r.title}</h2>
              <p className="text-zinc-500 font-terminal text-sm">{r.platform} · {r.source === "inventory" ? "📦 In your vault" : "🌐 PriceCharting"}</p>
            </div>

            {/* Dupe alert */}
            {r.owned > 0 && (
              <div className={`border px-4 py-2 font-terminal text-xl ${r.owned >= 2 ? "border-orange-700 bg-orange-950/30 text-orange-400" : "border-blue-800 bg-blue-950/20 text-blue-400"}`}>
                {r.owned >= 2 ? `⚠️ DUPE ALERT — you own ${r.owned} copies!` : `ℹ️ You own 1 copy`}
              </div>
            )}

            {/* Watchlist */}
            {r.watchlisted && (
              <div className="border border-yellow-700 bg-yellow-950/20 px-4 py-2 font-terminal text-xl text-yellow-400">
                ⭐ ON YOUR WATCHLIST{r.watchlistPrice ? ` — alert at $${r.watchlistPrice}` : ""}
              </div>
            )}

            {/* Prices */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "LOOSE", val: r.loose },
                { label: "CIB", val: r.cib },
                { label: "NEW", val: r.newPrice },
              ].map(({ label, val }) => (
                <div key={label} className="bg-zinc-900 border border-zinc-800 p-3 text-center">
                  <div className="text-zinc-600 font-terminal text-xs mb-1">{label}</div>
                  <div className="text-green-300 font-terminal text-xl">{val ? `$${parseFloat(val).toFixed(2)}` : "—"}</div>
                </div>
              ))}
            </div>

            {/* Decision */}
            {decision && (
              <div className={`border-2 p-4 text-center ${
                decision.verdict === "BUY" ? "border-emerald-600 bg-emerald-950/30" :
                decision.verdict === "PASS" ? "border-red-800 bg-red-950/20" :
                decision.verdict === "ALREADY OWNED" ? "border-orange-700 bg-orange-950/20" :
                "border-yellow-700 bg-yellow-950/20"
              }`}>
                <div className={`font-terminal text-4xl font-bold mb-1 ${decision.color}`}>
                  {decision.verdict}
                </div>
                <div className="text-zinc-400 font-terminal text-sm">{decision.reason}</div>
                {decision.verdict === "NEGOTIATE" && looseNum && (
                  <div className="text-yellow-500 font-terminal text-sm mt-2">
                    Suggested offer: ${(looseNum * 0.65).toFixed(2)} – ${(looseNum * 0.80).toFixed(2)}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {!searching && results.length === 0 && query && (
        <div className="text-center text-zinc-700 font-terminal text-xl py-8">No results. Try a different title or check spelling.</div>
      )}
    </div>
  );
}
