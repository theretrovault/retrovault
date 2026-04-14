"use client";

import { useState, useEffect, useCallback } from "react";

type WishlistItem = {
  id: string;
  title: string;
  platform: string;
  priority: 1 | 2 | 3;
  notes?: string | null;
  addedAt: string;
  foundAt?: string | null;
};

const PRIORITY_META = {
  1: { label: "⭐ Must-Have", color: "border-yellow-600 bg-yellow-950/20 text-yellow-300", badge: "bg-yellow-900 text-yellow-300" },
  2: { label: "🎮 Want",      color: "border-green-700  bg-green-950/20  text-green-400",  badge: "bg-green-900  text-green-300"  },
  3: { label: "📦 Someday",   color: "border-zinc-700   bg-zinc-900/20   text-zinc-400",   badge: "bg-zinc-800   text-zinc-300"   },
};

const PLATFORMS = [
  "NES","SNES","N64","GameCube","Wii","Wii U","Nintendo Switch",
  "Game Boy","Game Boy Color","Game Boy Advance","Nintendo DS","Nintendo 3DS",
  "Sega Genesis","Sega CD","Sega 32X","Sega Saturn","Dreamcast",
  "PlayStation","PlayStation 2","PlayStation 3","PlayStation 4","PlayStation 5",
  "PSP","PS Vita",
  "Xbox","Xbox 360","Xbox One","Xbox Series X",
  "Atari 2600","Atari 7800","TurboGrafx-16","Neo Geo","Other",
];

type Filter = "all" | "active" | "found";

export default function WishlistPage() {
  const [items,   setItems]   = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState<Filter>("active");
  const [search,  setSearch]  = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copyMsg,  setCopyMsg]  = useState("");
  const [form, setForm] = useState({
    title: "", platform: PLATFORMS[0], priority: 2 as 1 | 2 | 3, notes: "",
  });

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/wishlist")
      .then(r => r.json())
      .then(d => { setItems(d.items || []); setLoading(false); });
  }, []);

  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!form.title.trim()) return;
    await fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setShowAdd(false);
    setForm({ title: "", platform: PLATFORMS[0], priority: 2, notes: "" });
    load();
  };

  const markFound = async (id: string) => {
    await fetch(`/api/wishlist/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ foundAt: new Date().toISOString() }),
    });
    load();
  };

  const unmarkFound = async (id: string) => {
    await fetch(`/api/wishlist/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ foundAt: null }),
    });
    load();
  };

  const del = async (id: string) => {
    if (!confirm("Remove from wishlist?")) return;
    await fetch(`/api/wishlist/${id}`, { method: "DELETE" });
    load();
  };

  const getShareLink = async () => {
    const r = await fetch("/api/wishlist/share");
    const d = await r.json();
    const url = `${window.location.origin}/wishlist/public/${d.token}`;
    setShareUrl(url);
    try {
      await navigator.clipboard.writeText(url);
      setCopyMsg("Copied!");
      setTimeout(() => setCopyMsg(""), 2000);
    } catch {
      setCopyMsg("Copy the link above");
    }
  };

  const active = items.filter(i => !i.foundAt).length;
  const found  = items.filter(i => !!i.foundAt).length;

  const filtered = items.filter(i => {
    if (filter === "active" && i.foundAt) return false;
    if (filter === "found"  && !i.foundAt) return false;
    if (search && !i.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Group by priority for active view
  const grouped = [1, 2, 3].map(p => ({
    priority: p as 1 | 2 | 3,
    items: filtered.filter(i => i.priority === p && !i.foundAt),
  }));

  const inputCls = "bg-black border border-green-800 text-green-300 font-terminal px-3 py-2 focus:outline-none focus:border-green-500 w-full";
  const btnCls   = "px-4 py-2 font-terminal text-sm border transition-colors";

  return (
    <div className="w-full bg-black border-4 border-green-500 rounded p-6 shadow-[0_0_15px_rgba(34,197,94,0.3)] min-h-[80vh]">

      {/* Header */}
      <div className="border-b-4 border-green-900 pb-6 mb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl text-green-400 tracking-widest uppercase font-terminal">
            🎁 Wishlist
          </h2>
          <p className="text-zinc-500 font-terminal text-sm mt-1">
            {active} wanted · {found} found
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={getShareLink}
            className={`${btnCls} border-green-700 text-green-400 hover:bg-green-950`}
          >
            🔗 Share
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className={`${btnCls} border-green-500 bg-green-900 hover:bg-green-800 text-green-200`}
          >
            + ADD
          </button>
        </div>
      </div>

      {/* Share URL banner */}
      {shareUrl && (
        <div className="mb-6 p-4 border border-green-700 bg-green-950/30 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <span className="text-green-400 font-terminal text-sm flex-1 break-all">{shareUrl}</span>
          <span className="text-green-300 font-terminal text-xs">{copyMsg}</span>
          <button onClick={() => setShareUrl(null)} className="text-zinc-500 hover:text-red-400 font-terminal text-xs">dismiss</button>
        </div>
      )}

      {/* Add form */}
      {showAdd && (
        <div className="mb-6 p-4 border-2 border-green-700 bg-green-950/20">
          <h3 className="text-green-400 font-terminal mb-4">// ADD TO WISHLIST</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <input
              className={inputCls}
              placeholder="Game title *"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              onKeyDown={e => e.key === "Enter" && add()}
              autoFocus
            />
            <select
              className={inputCls}
              value={form.platform}
              onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}
            >
              {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <select
              className={inputCls}
              value={form.priority}
              onChange={e => setForm(f => ({ ...f, priority: parseInt(e.target.value) as 1|2|3 }))}
            >
              <option value={1}>⭐ Must-Have</option>
              <option value={2}>🎮 Want</option>
              <option value={3}>📦 Someday</option>
            </select>
            <input
              className={inputCls}
              placeholder="Notes (optional)"
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={add}
              className={`${btnCls} border-green-500 bg-green-900 hover:bg-green-800 text-green-200`}
            >
              ✓ Add to Wishlist
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className={`${btnCls} border-zinc-700 text-zinc-400 hover:text-red-400`}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Filter bar */}
      <div className="flex gap-3 mb-6 flex-wrap items-center">
        {([
          { id: "active", label: `🔍 Wanted (${active})` },
          { id: "found",  label: `✅ Found (${found})` },
          { id: "all",    label: `📋 All (${items.length})` },
        ] as { id: Filter; label: string }[]).map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-4 py-1 font-terminal text-sm border transition-colors ${
              filter === f.id
                ? "border-green-500 text-green-300 bg-green-950"
                : "border-green-900 text-zinc-500 hover:text-green-400"
            }`}
          >
            {f.label}
          </button>
        ))}
        <input
          className="ml-auto bg-black border border-green-900 text-green-300 font-terminal text-sm px-3 py-1 focus:outline-none focus:border-green-600 w-48"
          placeholder="Search..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-green-700 font-terminal animate-pulse">LOADING...</div>
      ) : filtered.length === 0 ? (
        <div className="text-zinc-600 font-terminal text-center py-16">
          {filter === "active" ? "Wishlist empty — add some games to hunt!" : "Nothing here yet."}
        </div>
      ) : filter === "active" ? (
        // Grouped by priority when showing active
        <div className="space-y-8">
          {grouped.filter(g => g.items.length > 0).map(({ priority, items: groupItems }) => {
            const meta = PRIORITY_META[priority];
            return (
              <div key={priority}>
                <h3 className={`font-terminal text-sm uppercase tracking-wider mb-3 ${meta.color.split(" ")[2]}`}>
                  {meta.label} ({groupItems.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {groupItems.map(item => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      onFound={markFound}
                      onUnfound={unmarkFound}
                      onDelete={del}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Flat list for found / all
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(item => (
            <ItemCard
              key={item.id}
              item={item}
              onFound={markFound}
              onUnfound={unmarkFound}
              onDelete={del}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ItemCard({
  item,
  onFound,
  onUnfound,
  onDelete,
}: {
  item: WishlistItem;
  onFound: (id: string) => void;
  onUnfound: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const meta  = PRIORITY_META[item.priority];
  const found = !!item.foundAt;

  return (
    <div className={`border p-3 relative group ${found ? "border-zinc-800 opacity-60" : meta.color}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className={`font-terminal text-sm font-bold truncate ${found ? "line-through text-zinc-500" : ""}`}>
            {item.title}
          </p>
          <span className={`inline-block text-xs px-2 py-0.5 mt-1 font-terminal ${meta.badge}`}>
            {item.platform}
          </span>
          {item.notes && (
            <p className="text-zinc-500 font-terminal text-xs mt-1 truncate">{item.notes}</p>
          )}
          {found && item.foundAt && (
            <p className="text-green-600 font-terminal text-xs mt-1">
              ✅ Found {new Date(item.foundAt).toLocaleDateString()}
            </p>
          )}
        </div>
        <button
          onClick={() => onDelete(item.id)}
          className="text-zinc-700 hover:text-red-500 font-terminal text-xs opacity-0 group-hover:opacity-100 transition-opacity ml-1 shrink-0"
          title="Remove"
        >✕</button>
      </div>
      <div className="mt-2 flex gap-2">
        {found ? (
          <button
            onClick={() => onUnfound(item.id)}
            className="text-zinc-500 hover:text-yellow-400 font-terminal text-xs border border-zinc-800 hover:border-yellow-700 px-2 py-0.5 transition-colors"
          >
            ↩ Unmark
          </button>
        ) : (
          <button
            onClick={() => onFound(item.id)}
            className="text-green-500 hover:text-green-300 font-terminal text-xs border border-green-800 hover:border-green-500 px-2 py-0.5 transition-colors"
          >
            ✓ Found It!
          </button>
        )}
      </div>
    </div>
  );
}
