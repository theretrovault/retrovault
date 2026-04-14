"use client";

import { useState, useEffect, useRef } from "react";
import { ALL_PLATFORMS } from "@/data/platformGroups";
import {
  buildFieldCache, readFieldCache, clearFieldCache, searchFieldCache,
  type FieldCacheData, type CachedGame,
} from "@/lib/fieldCache";

type PriceResult = {
  title: string;
  platform: string;
  loose: string | null;
  cib: string | null;
  newPrice: string | null;
  source: "inventory" | "pricecharting";
  owned: number;
  paidTotal: number;   // sum of priceAcquired across all copies
  paidEach: number[];  // per-copy cost for multi-copy display
  conditions: string[]; // condition label per copy (Loose, CIB, etc.)
  watchlisted: boolean;
  watchlistPrice?: string;
  // Stale/cached price info
  stale?: boolean;       // true if price is from cached inventory data, not a live scrape
  lastFetched?: string;  // ISO date of last successful scrape
  // Wishlist metadata (from offline cache)
  wishlistPriority?: number | null;
  wishlistNotes?: string | null;
};

type OwnedItem = {
  id: string;
  title: string;
  platform: string;
  copies: { id: string; priceAcquired?: number | string; condition?: string }[];
  marketLoose?: string;
  marketCib?: string;
  marketNew?: string;
  lastFetched?: string;
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

const MAX_SUGGESTIONS = 8;
const SUGGEST_DEBOUNCE_MS = 150;

export default function FieldPage() {
  const [query, setQuery] = useState("");
  const [platform, setPlatform] = useState("all");
  const [askPrice, setAskPrice] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<PriceResult[]>([]);
  const [inventory, setInventory] = useState<OwnedItem[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  // Pre-seeded with all known platforms so the select works before inventory loads
  const [platforms, setPlatforms] = useState<string[]>(ALL_PLATFORMS);
  // Offline cache state
  const [fieldCache,    setFieldCache]    = useState<FieldCacheData | null>(null);
  const [cacheMeta,     setCacheMeta]     = useState<{ cachedAt: string; count: number } | null>(null);
  const [caching,       setCaching]       = useState(false);
  const [cacheProgress, setCacheProgress] = useState("");
  const [suggestions, setSuggestions] = useState<{ title: string; platform: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Keep catalog in a ref — filtering never triggers re-renders
  const catalogRef = useRef<{ title: string; platform: string }[]>([]);

  useEffect(() => {
    inputRef.current?.focus();
    // Load inventory and watchlist for dupe detection + watchlist check
    fetch("/api/inventory").then(r => r.json()).then((d: OwnedItem[]) => {
      setInventory(d);
      // Owned platforms first, then the rest of the known catalog
      const owned = Array.from(new Set(d.map((i: OwnedItem) => i.platform))).sort() as string[];
      const rest = ALL_PLATFORMS.filter(p => !owned.includes(p));
      setPlatforms([...owned, ...rest]);
      // Store lightweight catalog copy in ref for suggestion filtering
      catalogRef.current = d.map(i => ({ title: i.title, platform: i.platform }));
    }).catch(() => {});
    fetch("/api/sales?type=watchlist").then(r => r.json()).then(d => {
      if (Array.isArray(d)) setWatchlist(d);
    }).catch(() => {});
    // Load offline cache metadata on mount
    readFieldCache().then(cache => {
      if (cache) {
        setFieldCache(cache);
        setCacheMeta({ cachedAt: cache.cachedAt, count: cache.games.length });
        // Also populate catalog from cache so autocomplete works offline
        if (catalogRef.current.length === 0) {
          catalogRef.current = cache.games.map(g => ({ title: g.title, platform: g.platform }));
        }
      }
    }).catch(() => {});
  }, []);

  // Debounced suggestion filtering — pure client-side, no network
  // Convert a cached game to PriceResult for display
  const cachedToResult = (g: CachedGame, offline: boolean): PriceResult => ({
    title:        g.title,
    platform:     g.platform,
    loose:        g.marketLoose  != null ? String(g.marketLoose)  : null,
    cib:          g.marketCib    != null ? String(g.marketCib)    : null,
    newPrice:     g.marketNew    != null ? String(g.marketNew)    : null,
    source:       'inventory',
    owned:        g.owned,
    paidTotal:    g.paidTotal,
    paidEach:     g.paidEach,
    conditions:   g.conditions,
    watchlisted:  g.onWatchlist,
    watchlistPrice: g.watchlistPrice != null ? String(g.watchlistPrice) : undefined,
    stale:        offline,
    lastFetched:  g.lastFetched ?? undefined,
    // Wishlist info passed via notes field for display
    ...(g.onWishlist ? { wishlistPriority: g.wishlistPriority, wishlistNotes: g.wishlistNotes } : {}),
  });

  // Build the offline cache — triggered by the Cache button
  const handleBuildCache = async () => {
    setCaching(true);
    setCacheProgress('Starting...');
    try {
      const { count, sizeKb } = await buildFieldCache((step, _pct) => setCacheProgress(step));
      const cache = await readFieldCache();
      setFieldCache(cache);
      setCacheMeta(cache ? { cachedAt: cache.cachedAt, count } : null);
      setCacheProgress(`✓ ${count} games cached (${sizeKb}KB)`);
      if (cache) catalogRef.current = cache.games.map(g => ({ title: g.title, platform: g.platform }));
    } catch (e: any) {
      setCacheProgress(`Error: ${e.message}`);
    } finally {
      setCaching(false);
    }
  };

  const handleClearCache = async () => {
    await clearFieldCache();
    setFieldCache(null);
    setCacheMeta(null);
    setCacheProgress('');
  };

  const updateSuggestions = (q: string, plat: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q || q.length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
    debounceRef.current = setTimeout(() => {
      const lower = q.toLowerCase();
      const catalog = catalogRef.current;
      const platFilter = plat !== 'all';
      // Prefer: starts-with matches first, then contains
      const startsWith = catalog.filter(i =>
        i.title.toLowerCase().startsWith(lower) &&
        (!platFilter || i.platform === plat)
      );
      const contains = catalog.filter(i =>
        !i.title.toLowerCase().startsWith(lower) &&
        i.title.toLowerCase().includes(lower) &&
        (!platFilter || i.platform === plat)
      );
      const merged = [...startsWith, ...contains].slice(0, MAX_SUGGESTIONS);
      setSuggestions(merged);
      setShowSuggestions(merged.length > 0);
      setActiveSuggestion(-1);
    }, SUGGEST_DEBOUNCE_MS);
  };

  const pickSuggestion = (s: { title: string; platform: string }) => {
    setQuery(s.title);
    if (s.platform) setPlatform(s.platform);
    setSuggestions([]);
    setShowSuggestions(false);
    setActiveSuggestion(-1);
    // Call with explicit values to avoid stale closure on query/platform state
    doSearch(s.title, s.platform || platform);
  };

  // Main search — accepts explicit title+platform so pickSuggestion can pass values
  // without depending on possibly-stale state closures
  const doSearch = async (titleQ: string, plat: string) => {
    if (!titleQ.trim()) return;
    setShowSuggestions(false);
    setSuggestions([]);
    setSearching(true);
    setResults([]);

    const q = titleQ.toLowerCase();
    const platFilter = plat !== "all";

    // ── Offline-first: if we have a field cache and appear to be offline, use it immediately ──
    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
    if (isOffline && fieldCache) {
      const cached = searchFieldCache(fieldCache, titleQ, plat);
      if (cached.length > 0) {
        setResults(cached.map(g => cachedToResult(g, true)));
      }
      setSearching(false);
      return;
    }

    // Check own inventory first (instant, no network)
    const owned = inventory.filter(i =>
      i.title.toLowerCase().includes(q) &&
      (!platFilter || i.platform === plat)
    );

    if (owned.length > 0) {
      const fromInventory: PriceResult[] = owned.slice(0, 5).map(i => {
        const copies = i.copies || [];
        const paidEach = copies.map(c => parseFloat(String(c.priceAcquired || 0)) || 0);
        const paidTotal = paidEach.reduce((s, v) => s + v, 0);
        const conditions = copies.map(c => c.condition || 'Loose');
        return {
          title: i.title, platform: i.platform,
          loose: i.marketLoose || null, cib: i.marketCib || null, newPrice: i.marketNew || null,
          source: "inventory" as const,
          owned: copies.length, paidTotal, paidEach, conditions,
          watchlisted: watchlist.some(w => w.id === i.id),
          watchlistPrice: watchlist.find(w => w.id === i.id)?.alertPrice,
        };
      });
      setResults(fromInventory);
      setSearching(false);
      return;
    }

    // Fall back to PriceCharting with 9s client-side timeout (server adds its own 8s)
    try {
      const platParam = platFilter ? plat : "";
      const controller = new AbortController();
      const clientTimeout = setTimeout(() => controller.abort(), 9000);

      const res = await fetch(
        `/api/pricecharting?title=${encodeURIComponent(titleQ)}&platform=${encodeURIComponent(platParam)}`,
        { signal: controller.signal }
      );
      clearTimeout(clientTimeout);

      // Handle timeout (408) or network error
      if (res.status === 408 || !res.ok) {
        // Try to show cached price from inventory catalog for this title
        const cached = inventory.find(i =>
          i.title.toLowerCase().includes(q) && (!platFilter || i.platform === plat)
        );
        if (cached && (cached.marketLoose || cached.marketCib)) {
          setResults([{
            title: cached.title,
            platform: cached.platform,
            loose: cached.marketLoose || null,
            cib: cached.marketCib || null,
            newPrice: cached.marketNew || null,
            source: "inventory",
            owned: (cached.copies || []).length,
            paidTotal: 0, paidEach: [], conditions: [],
            watchlisted: watchlist.some(w => w.id === cached.id),
            stale: true,
            lastFetched: cached.lastFetched,
          }]);
        }
        // else: no result, leave results empty
        setSearching(false);
        return;
      }

      const d = await res.json();
      if (d && d.title) {
        setResults([{
          title: d.title,
          platform: d.platform || plat || "Unknown",
          loose: d.loose || null, cib: d.cib || null, newPrice: d.new || null,
          source: "pricecharting",
          owned: 0, paidTotal: 0, paidEach: [], conditions: [],
          watchlisted: false,
        }]);
      }
    } catch (e: any) {
      // AbortError = client-side timeout — try field cache first, then inventory
      if (e?.name === 'AbortError') {
        if (fieldCache) {
          const cachedResults = searchFieldCache(fieldCache, titleQ, plat);
          if (cachedResults.length > 0) {
            setResults(cachedResults.map(g => cachedToResult(g, true)));
            setSearching(false);
            return;
          }
        }
        // Fallback: inventory state
        const cached = inventory.find(i =>
          i.title.toLowerCase().includes(q) && (!platFilter || i.platform === plat)
        );
        if (cached && (cached.marketLoose || cached.marketCib)) {
          setResults([{
            title: cached.title, platform: cached.platform,
            loose: cached.marketLoose || null, cib: cached.marketCib || null,
            newPrice: cached.marketNew || null,
            source: 'inventory',
            owned: (cached.copies || []).length,
            paidTotal: 0, paidEach: [], conditions: [],
            watchlisted: watchlist.some(w => w.id === cached.id),
            stale: true, lastFetched: cached.lastFetched,
          }]);
        }
      }
    }
    setSearching(false);
  };

  const search = () => doSearch(query, platform);

  const askNum = parseFloat(askPrice);
  const hasAsk = !isNaN(askNum) && askNum > 0;

  return (
    <div className="min-h-screen bg-black p-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-4">
        <h1 className="font-terminal text-3xl text-green-400 uppercase tracking-widest mb-1">🔦 Field Mode</h1>
        <p className="text-zinc-600 font-terminal text-sm">Quick price check · Dupe alert · Should I buy?</p>
      </div>

      {/* Offline Cache Panel */}
      <div className="mb-5 border border-zinc-800 bg-zinc-950 p-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-0">
            {cacheMeta ? (
              <div className="font-terminal text-xs">
                <span className="text-green-600">📦 Offline cache ready</span>
                <span className="text-zinc-600 ml-2">
                  {cacheMeta.count} games · cached {new Date(cacheMeta.cachedAt).toLocaleDateString()} {new Date(cacheMeta.cachedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ) : (
              <div className="font-terminal text-xs text-zinc-600">
                No offline cache — tap Cache before entering the show
              </div>
            )}
            {cacheProgress && (
              <div className="font-terminal text-xs text-yellow-600 mt-1">{cacheProgress}</div>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={handleBuildCache}
              disabled={caching}
              className="px-3 py-1.5 font-terminal text-xs border border-green-700 text-green-400 hover:bg-green-950 disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              {caching ? '⏳ Caching...' : '📥 Cache for Offline'}
            </button>
            {cacheMeta && (
              <button
                onClick={handleClearCache}
                className="px-3 py-1.5 font-terminal text-xs border border-zinc-800 text-zinc-600 hover:text-red-400 hover:border-red-800 transition-colors"
                title="Clear offline cache"
              >
                × Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="space-y-3 mb-6">
        <div className="relative">
          <input ref={inputRef} type="text" value={query}
            onChange={e => { setQuery(e.target.value); updateSuggestions(e.target.value, platform); }}
            onKeyDown={e => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveSuggestion(a => Math.min(a + 1, suggestions.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveSuggestion(a => Math.max(a - 1, -1));
              } else if (e.key === "Enter") {
                if (activeSuggestion >= 0 && suggestions[activeSuggestion]) {
                  pickSuggestion(suggestions[activeSuggestion]);
                } else {
                  search();
                }
              } else if (e.key === "Escape") {
                setShowSuggestions(false);
              }
            }}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            placeholder="GAME TITLE..."
            className="w-full bg-zinc-950 border-2 border-green-800 text-green-300 font-terminal text-2xl p-4 uppercase focus:outline-none focus:border-green-500 placeholder-green-900"
          />
          {showSuggestions && suggestions.length > 0 && (
            <div ref={suggestRef}
              className="absolute z-50 w-full bg-zinc-950 border-2 border-green-700 shadow-[0_4px_20px_rgba(34,197,94,0.2)] max-h-64 overflow-y-auto">
              {suggestions.map((s, i) => (
                <button
                  key={`${s.title}-${s.platform}`}
                  onPointerDown={e => { e.preventDefault(); pickSuggestion(s); }}
                  className={`w-full text-left px-4 py-3 font-terminal flex items-center justify-between gap-3 border-b border-zinc-900 transition-colors ${
                    i === activeSuggestion
                      ? 'bg-green-900/40 text-green-200'
                      : 'text-green-400 hover:bg-zinc-900'
                  }`}
                >
                  <span className="truncate uppercase text-sm">{s.title}</span>
                  <span className="text-zinc-600 text-xs shrink-0">{s.platform}</span>
                </button>
              ))}
              <div className="px-4 py-2 text-zinc-700 font-terminal text-xs border-t border-zinc-900">
                ↑↓ navigate · Enter select · Esc close · or keep typing to free-search
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <select value={platform} onChange={e => { setPlatform(e.target.value); updateSuggestions(query, e.target.value); }}
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

            {/* Dupe alert + what you paid */}
            {r.owned > 0 && (
              <div className={`border px-4 py-2 font-terminal ${r.owned >= 2 ? "border-orange-700 bg-orange-950/30 text-orange-400" : "border-blue-800 bg-blue-950/20 text-blue-400"}`}>
                <div className="text-xl mb-1">
                  {r.owned >= 2
                    ? `⚠️ DUPE ALERT — you own ${r.owned} copies (${r.conditions.join(' + ')})!`
                    : `ℹ️ You own 1 ${r.conditions[0] ?? 'Loose'} copy`
                  }
                </div>
                {r.paidTotal > 0 && (
                  <div className="text-sm text-zinc-400 font-terminal">
                    {r.owned === 1
                      ? `Paid: $${r.paidTotal.toFixed(2)}`
                      : `Paid: ${r.paidEach.map((p, i) => `Copy ${i + 1}: $${p.toFixed(2)}`).join(" · ")} (total $${r.paidTotal.toFixed(2)})`
                    }
                    {r.loose && r.paidTotal > 0 && (() => {
                      const mkt = parseFloat(r.loose);
                      const gain = mkt - (r.paidTotal / r.owned);
                      const gainPct = ((gain / (r.paidTotal / r.owned)) * 100);
                      return gain !== 0 ? (
                        <span className={`ml-2 ${gain > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          ({gain > 0 ? '+' : ''}${gain.toFixed(2)} · {gainPct > 0 ? '+' : ''}{gainPct.toFixed(0)}% vs market)
                        </span>
                      ) : null;
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* Watchlist */}
            {r.watchlisted && (
              <div className="border border-yellow-700 bg-yellow-950/20 px-4 py-2 font-terminal text-xl text-yellow-400">
                ⭐ ON YOUR WATCHLIST{r.watchlistPrice ? ` — alert at $${r.watchlistPrice}` : ""}
              </div>
            )}

            {/* Wishlist badge */}
            {r.wishlistPriority != null && (
              <div className="border border-pink-800 bg-pink-950/20 px-4 py-2 font-terminal text-xl text-pink-400">
                🎁 ON YOUR WISHLIST
                {r.wishlistPriority === 1 && <span className="ml-2 text-yellow-400 text-sm">⭐ Must-Have</span>}
                {r.wishlistPriority === 2 && <span className="ml-2 text-green-500 text-sm">🎮 Want</span>}
                {r.wishlistPriority === 3 && <span className="ml-2 text-zinc-500 text-sm">📦 Someday</span>}
                {r.wishlistNotes && <p className="text-xs text-zinc-500 mt-0.5">{r.wishlistNotes}</p>}
              </div>
            )}

            {/* Stale price warning */}
            {r.stale && (
              <div className="border border-yellow-800 bg-yellow-950/20 px-3 py-2 font-terminal text-xs text-yellow-600">
                ⚠️ Live price unavailable (network timeout) — showing cached price
                {r.lastFetched && ` from ${new Date(r.lastFetched).toLocaleDateString()}`}
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
