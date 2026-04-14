"use client";
/**
 * AddAssetModal — Add or edit a game in the collection
 *
 * Used for both "Add new asset" and "Edit existing asset" flows.
 * The same modal handles both cases via the initialData prop.
 *
 * Key behaviors:
 * - Autocomplete suggestions from the catalog (filtered by selected platform)
 * - Suggestions stored in a ref to avoid re-renders on every keystroke
 * - Platform recents tracked in localStorage for quick re-selection
 * - Field component hoisted to module scope (prevents focus loss on re-render)
 *
 * @param onSave    Called with the completed form data. Caller handles the API write.
 * @param onClose   Called to dismiss the modal (backdrop click or cancel).
 * @param initialData  Pre-populate for edit mode. Omit for new asset.
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { CONSOLES } from "@/data/consoles";

const SORTED_PLATFORMS = [...CONSOLES]
  .sort((a, b) => b.releaseYear - a.releaseYear)
  .map(c => ({ name: c.shortName, year: c.releaseYear }));

const RECENT_KEY = "recentPlatforms";

function getRecentPlatforms(): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"); }
  catch { return []; }
}

function saveRecentPlatform(platform: string) {
  const recent = getRecentPlatforms().filter(p => p !== platform);
  localStorage.setItem(RECENT_KEY, JSON.stringify([platform, ...recent].slice(0, 5)));
}

export type AssetFormData = {
  title: string;
  platform: string;
  condition: string;
  hasBox: boolean;
  hasManual: boolean;
  priceAcquired: string;
  purchaseDate: string;
  source: string;
  notes: string;
  isDigital: boolean;
};

type Props = {
  onClose: () => void;
  onSave: (data: AssetFormData) => Promise<void>;
  initialData?: Partial<AssetFormData>;
  title?: string;
};

// ── Hoisted outside AddAssetModal to prevent focus loss on re-render ─────────
// Defining components inside render functions causes React to unmount+remount
// them on every state change, stealing focus from active inputs.
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm text-zinc-400 font-terminal mb-1 uppercase">
        {label}{error && <span className="text-red-500 ml-1">— {error}</span>}
      </label>
      {children}
    </div>
  );
}

export function AddAssetModal({ onClose, onSave, initialData, title = "ADD ASSET" }: Props) {
  const [platform, setPlatform] = useState(initialData?.platform || "");
  const [titleInput, setTitleInput] = useState(initialData?.title || "");
  const [condition, setCondition] = useState(initialData?.condition || "Loose");
  const [hasBox, setHasBox] = useState(initialData?.hasBox || false);
  const [hasManual, setHasManual] = useState(initialData?.hasManual || false);
  const [isDigital, setIsDigital] = useState(initialData?.isDigital || false);
  const [price, setPrice] = useState(initialData?.priceAcquired || "");
  const [purchaseDate, setPurchaseDate] = useState(
    initialData?.purchaseDate || new Date().toISOString().split("T")[0]
  );
  const [source, setSource] = useState(initialData?.source || "");
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // These use refs to NEVER trigger re-renders
  const inventoryRef = useRef<{ title: string; platform: string }[]>([]);
  const recentRef = useRef<string[]>(getRecentPlatforms());
  const titleInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Separate suggestion state — only triggers re-render of suggestion list, not input
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Load inventory into ref once — never triggers component re-render
  useEffect(() => {
    fetch("/api/inventory")
      .then(r => r.json())
      .then((d: any[]) => {
        inventoryRef.current = d.map(i => ({ title: i.title, platform: i.platform }));
      });
  }, []);

  const getSuggestions = (query: string, plat: string): string[] => {
    if (!query || query.length < 1 || !plat) return [];
    const lower = query.toLowerCase();
    return inventoryRef.current
      .filter(i => i.platform.toLowerCase() === plat.toLowerCase() && i.title.toLowerCase().includes(lower))
      .map(i => i.title)
      .slice(0, 10);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitleInput(val);
    const sugg = getSuggestions(val, platform);
    setSuggestions(sugg);
    setShowSuggestions(sugg.length > 0 && val.length > 0);
  };

  const handlePlatformChange = (plat: string) => {
    setPlatform(plat);
    setSuggestions([]);
    setShowSuggestions(false);
    setTitleInput("");
    // Re-focus the title field after platform change
    setTimeout(() => titleInputRef.current?.focus(), 50);
  };

  const handleConditionChange = (c: string) => {
    setCondition(c);
    // Update box/manual/digital without triggering useEffect re-renders
    if (c === "CIB") { setHasBox(true); setHasManual(true); setIsDigital(false); }
    else if (c === "Loose") { setHasBox(false); setHasManual(false); setIsDigital(false); }
    else if (c === "Digital") { setHasBox(false); setHasManual(false); setIsDigital(true); }
    else { setIsDigital(false); }
  };

  const selectSuggestion = (s: string) => {
    setTitleInput(s);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  // Close dropdown on outside click
  useEffect(() => {
    if (!showSuggestions) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!dropdownRef.current?.contains(target) && target !== titleInputRef.current) {
        setShowSuggestions(false);
      }
    };
    setTimeout(() => document.addEventListener("click", handler), 0);
    return () => document.removeEventListener("click", handler);
  }, [showSuggestions]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!platform) e.platform = "System is required.";
    if (!titleInput.trim()) e.title = "Title is required.";
    if (!isDigital && (!price || isNaN(parseFloat(price)) || parseFloat(price) < 0)) {
      e.price = "A valid cost is required.";
    }
    if (!purchaseDate) e.purchaseDate = "Date is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    saveRecentPlatform(platform);
    await onSave({ title: titleInput.trim(), platform, condition, hasBox, hasManual,
      priceAcquired: isDigital ? "0" : price, purchaseDate, source, notes, isDigital });
    setSaving(false);
  };

  const orderedPlatforms = [
    ...recentRef.current.filter(r => SORTED_PLATFORMS.some(p => p.name === r)),
    ...SORTED_PLATFORMS.map(p => p.name).filter(n => !recentRef.current.includes(n)),
  ];

  const inputCls = (err?: string) =>
    `w-full bg-black border-2 ${err ? "border-red-700" : "border-green-800"} text-green-300 p-2 font-terminal text-xl focus:outline-none focus:border-green-400`;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-start justify-center z-50 backdrop-blur-sm overflow-y-auto py-8"
      onClick={onClose}>
      <div className="bg-zinc-950 border-4 border-green-500 p-6 rounded-sm w-full max-w-xl mx-4 shadow-[0_0_30px_rgba(34,197,94,0.3)] my-auto"
        onClick={e => e.stopPropagation()}>
        <h3 className="text-2xl text-green-400 font-terminal uppercase mb-6 tracking-widest border-b-2 border-green-900 pb-2">{title}</h3>

        <div className="space-y-4">
          {/* Platform */}
          <Field label="System *" error={errors.platform}>
            <select value={platform} onChange={e => handlePlatformChange(e.target.value)}
              className={inputCls(errors.platform) + " cursor-pointer"}>
              <option value="">— SELECT SYSTEM —</option>
              {recentRef.current.length > 0 && (
                <optgroup label="Recently Used">
                  {recentRef.current.filter(r => SORTED_PLATFORMS.some(p => p.name === r)).map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </optgroup>
              )}
              <optgroup label="All Systems (newest first)">
                {SORTED_PLATFORMS.filter(p => !recentRef.current.includes(p.name)).map(p => (
                  <option key={p.name} value={p.name}>{p.name} ({p.year})</option>
                ))}
              </optgroup>
            </select>
          </Field>

          {/* Title */}
          <Field label="Game Title *" error={errors.title}>
            <div className="relative">
              <input
                ref={titleInputRef}
                type="text"
                className={inputCls(errors.title)}
                placeholder={platform ? "START TYPING..." : "SELECT SYSTEM FIRST"}
                value={titleInput}
                onChange={handleTitleChange}
                disabled={!platform}
                autoComplete="off"
                spellCheck={false}
              />
              {showSuggestions && suggestions.length > 0 && (
                <div ref={dropdownRef}
                  className="absolute top-full left-0 right-0 z-30 bg-zinc-900 border-2 border-green-700 max-h-48 overflow-y-auto shadow-xl">
                  {suggestions.map(s => (
                    <button key={s}
                      type="button"
                      onMouseDown={e => {
                        e.preventDefault();
                        selectSuggestion(s);
                      }}
                      className="w-full px-3 py-2 text-left text-green-300 hover:bg-green-900/50 font-terminal text-lg">
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {platform && titleInput.length > 0 && suggestions.length === 0 && (
              <p className="text-zinc-600 font-terminal text-xs mt-1">No catalog matches — custom title will be used.</p>
            )}
          </Field>

          {/* Condition */}
          <Field label="Condition *">
            <div className="flex gap-2 flex-wrap">
              {["Loose","CIB","Digital","Other"].map(c => (
                <button key={c} type="button" onClick={() => handleConditionChange(c)}
                  className={`px-4 py-2 font-terminal text-lg border-2 transition-colors ${condition === c ? "bg-green-600 text-black border-green-400" : "text-zinc-400 border-zinc-700 hover:border-green-700"}`}>
                  {c}
                </button>
              ))}
            </div>
            {condition === "Other" && (
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2 text-zinc-400 font-terminal text-lg cursor-pointer">
                  <input type="checkbox" className="w-5 h-5 accent-green-600" checked={hasBox}
                    onChange={e => setHasBox(e.target.checked)} /> Box
                </label>
                <label className="flex items-center gap-2 text-zinc-400 font-terminal text-lg cursor-pointer">
                  <input type="checkbox" className="w-5 h-5 accent-green-600" checked={hasManual}
                    onChange={e => setHasManual(e.target.checked)} /> Manual
                </label>
              </div>
            )}
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label={isDigital ? "Cost (optional)" : "Cost Paid ($) *"} error={errors.price}>
              <div className="flex">
                <span className="bg-zinc-900 border-2 border-r-0 border-green-800 text-green-400 px-3 flex items-center font-terminal">$</span>
                <input type="number" step="0.01" min="0"
                  className={inputCls(errors.price) + " flex-1 border-l-0"}
                  placeholder="0.00" value={price} onChange={e => setPrice(e.target.value)}
                  disabled={isDigital} />
              </div>
            </Field>
            <Field label="Purchase Date *" error={errors.purchaseDate}>
              <input type="date" className={inputCls(errors.purchaseDate)} value={purchaseDate}
                onChange={e => setPurchaseDate(e.target.value)} />
            </Field>
          </div>

          <Field label="Source">
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1">
                {["Garage Sale","Thrift Store","eBay","Facebook Marketplace","Craigslist","Game Store","Convention","Trade","Lot Purchase","Whatnot","Gift","r/gameswap"].map(s => (
                  <button key={s} type="button" onClick={() => setSource(s)}
                    className={`px-2 py-0.5 font-terminal text-xs border transition-colors ${
                      source === s ? 'bg-green-700 text-black border-green-500' : 'text-zinc-500 border-zinc-700 hover:border-zinc-500'
                    }`}>{s}</button>
                ))}
              </div>
              <input type="text" className={inputCls()} placeholder="Or type a custom source..."
                value={source} onChange={e => setSource(e.target.value)} />
            </div>
          </Field>

          <Field label="Notes">
            <textarea className={inputCls() + " h-16 resize-none"} placeholder="Optional notes..."
              value={notes} onChange={e => setNotes(e.target.value)} />
          </Field>

          {isDigital && (
            <div className="bg-blue-900/20 border border-blue-700 p-3 rounded-sm font-terminal text-blue-400 text-sm">
              ℹ️ Digital assets are excluded from market value, Buy/Sell scores, and P&L calculations.
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t-2 border-green-900 flex justify-between items-center">
          <div className="text-zinc-600 font-terminal text-sm">* Required fields</div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="px-4 py-2 font-terminal text-xl text-zinc-400 hover:text-white">CANCEL</button>
            <button type="button" onClick={handleSave} disabled={saving}
              className="px-4 py-2 font-terminal text-xl bg-green-600 text-black font-bold hover:bg-green-500 disabled:opacity-50 shadow-[0_0_10px_rgba(34,197,94,0.4)]">
              {saving ? "SAVING..." : "COMMIT ASSET"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
