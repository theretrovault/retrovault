"use client";
import { useEffect, useState } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { COLOR_PALETTES, STYLE_THEMES } from "@/data/themes";
import { NAV_GROUPS } from "@/data/navConfig";
import { PLATFORM_GROUPS, RETRO_DEFAULTS, ALL_PLATFORMS } from "@/data/platformGroups";
import { useRef } from "react";
import Link from "next/link";

type Features = {
  collection: boolean; business: boolean; fieldTools: boolean;
  social: boolean; personal: boolean; media: boolean;
};

type Config = {
  appName: string; tagline: string; ownerName: string; themeColor: string;
  currency: string; dateFormat: string; publicUrl: string; standaloneMode: boolean;
  auth: { enabled: boolean; passwordHash: string };
  plex: { url: string; token: string };
  fetchScheduleHour: number; priceDataSource: string;
  features: Features;
};

const THEME_COLORS = ["green","blue","purple","orange","cyan","yellow","pink"];

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [config, setConfig] = useState<Config | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [openInfoId, setOpenInfoId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwError, setPwError] = useState("");

  useEffect(() => {
    fetch('/api/config').then(r => r.json()).then(setConfig);
  }, []);

  const save = async (updates: Partial<Config> & { newPassword?: string }) => {
    setSaving(true);
    await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handlePasswordSave = async () => {
    setPwError("");
    if (newPassword !== confirmPassword) { setPwError("Passwords don't match."); return; }
    await save({ newPassword });
    setNewPassword(""); setConfirmPassword("");
    fetch('/api/config').then(r => r.json()).then(setConfig);
  };

  if (!config) return <div className="text-green-500 font-terminal text-2xl animate-pulse p-6">LOADING CONFIG...</div>;

  const input = (key: keyof Config, label: string, type = "text", placeholder = "") => (
    <div>
      <label className="block text-zinc-400 font-terminal text-sm mb-1 uppercase">{label}</label>
      <input type={type} className="w-full bg-black border-2 border-green-800 text-green-300 p-2 font-terminal text-xl focus:outline-none focus:border-green-400"
        placeholder={placeholder} value={(config as any)[key] || ""}
        onChange={e => setConfig({ ...config, [key]: e.target.value })} />
    </div>
  );

  const Section = ({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) => (
    <div className="bg-zinc-950 border-2 border-green-800 rounded-sm p-6 space-y-5">
      <h3 className="text-green-400 font-terminal text-2xl uppercase border-b border-green-900 pb-2">{icon} {title}</h3>
      {children}
    </div>
  );

  return (
    <div className="w-full bg-black border-4 border-green-500 rounded p-6 shadow-[0_0_15px_rgba(34,197,94,0.3)] min-h-[80vh] flex flex-col space-y-6">
      <header className="border-b-4 border-green-900 pb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="text-3xl">⚙️</span>
          <h2 className="text-2xl sm:text-3xl text-green-400 tracking-widest uppercase">App Settings</h2>
        </div>
        <button onClick={() => save(config)} disabled={saving}
          className={`px-6 py-2 font-terminal text-xl font-bold transition-colors border-2 ${saved ? "bg-emerald-600 text-black border-emerald-400" : "bg-green-600 hover:bg-green-500 text-black border-green-400"} disabled:opacity-50`}>
          {saved ? "✓ SAVED!" : saving ? "SAVING..." : "SAVE ALL"}
        </button>
      </header>

      <Section title="Theme" icon="🎨">
        <div>
          <label className="block text-zinc-400 font-terminal text-sm mb-3 uppercase">Color Palette</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {COLOR_PALETTES.map(p => (
              <button key={p.id}
                onClick={() => setTheme({ ...theme, colorId: p.id })}
                style={{ borderColor: theme.colorId === p.id ? p.primary : undefined, boxShadow: theme.colorId === p.id ? `0 0 12px ${p.primaryGlow}` : undefined }}
                className={`p-3 text-left border-2 rounded-sm transition-all ${
                  theme.colorId === p.id ? "border-current" : "border-zinc-800 hover:border-zinc-600"
                }`}>
                <div className="flex items-center gap-2 mb-1">
                  <span>{p.emoji}</span>
                  <span className="font-terminal text-sm uppercase" style={{ color: p.primary }}>{p.name}</span>
                </div>
                <p className="text-zinc-600 font-terminal text-xs">{p.description}</p>
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-zinc-400 font-terminal text-sm mb-3 uppercase">Style Theme</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {STYLE_THEMES.map(s => (
              <button key={s.id}
                onClick={() => setTheme({ ...theme, styleId: s.id })}
                className={`p-3 text-left border-2 rounded-sm transition-all ${
                  theme.styleId === s.id ? "border-green-500 bg-green-900/20" : "border-zinc-800 hover:border-zinc-600"
                }`}>
                <div className="text-2xl mb-1">{s.emoji}</div>
                <div className="font-terminal text-sm text-green-400 uppercase mb-1">{s.name}</div>
                <p className="text-zinc-600 font-terminal text-xs">{s.description}</p>
              </button>
            ))}
          </div>
        </div>
        <p className="text-zinc-600 font-terminal text-xs">Theme changes apply instantly and are saved in your browser.</p>
      </Section>

      <Section title="Identity" icon="🏷️">
        {input("appName", "App Name")}
        {input("tagline", "Tagline")}
        {input("ownerName", "Collection Owner Name", "text", "e.g. John's Collection")}
        <div>
          <label className="block text-zinc-400 font-terminal text-sm mb-1 uppercase">Theme Color</label>
          <div className="flex gap-2 flex-wrap">
            {THEME_COLORS.map(c => (
              <button key={c} onClick={() => setConfig({ ...config, themeColor: c })}
                className={`px-4 py-2 font-terminal text-lg border-2 capitalize transition-colors ${config.themeColor === c ? "bg-green-600 text-black border-green-400" : "text-zinc-400 border-zinc-700 hover:border-zinc-400"}`}>
                {c}
              </button>
            ))}
          </div>
          <p className="text-zinc-600 font-terminal text-xs mt-1">Note: Theme color changes will take full effect after the next deployment.</p>
        </div>
      </Section>

      <Section title="Localization" icon="🌍">
        <div>
          <label className="block text-zinc-400 font-terminal text-sm mb-1 uppercase">Currency Symbol</label>
          <input type="text" maxLength={3} className="w-24 bg-black border-2 border-green-800 text-green-300 p-2 font-terminal text-2xl text-center focus:outline-none focus:border-green-400"
            value={config.currency} onChange={e => setConfig({ ...config, currency: e.target.value })} />
        </div>
        <div>
          <label className="block text-zinc-400 font-terminal text-sm mb-1 uppercase">Date Format</label>
          <div className="flex gap-2">
            {[["US", "MM/DD/YYYY"], ["ISO", "YYYY-MM-DD"], ["EU", "DD/MM/YYYY"]].map(([fmt, example]) => (
              <button key={fmt} onClick={() => setConfig({ ...config, dateFormat: fmt })}
                className={`px-4 py-2 font-terminal text-lg border-2 transition-colors ${config.dateFormat === fmt ? "bg-green-600 text-black border-green-400" : "text-zinc-400 border-zinc-700 hover:border-zinc-400"}`}>
                {fmt} <span className="text-sm opacity-60">({example})</span>
              </button>
            ))}
          </div>
        </div>
      </Section>

      <Section title="Deployment" icon="🌐">
        {input("publicUrl", "Public URL", "url", "https://retrovault.yourdomain.com")}
        <div>
          <label className="block text-zinc-400 font-terminal text-sm mb-2 uppercase">Mode</label>
          <div className="flex gap-3">
            <button onClick={() => setConfig({ ...config, standaloneMode: true })}
              className={`px-4 py-2 font-terminal text-lg border-2 transition-colors ${config.standaloneMode ? "bg-green-600 text-black border-green-400" : "text-zinc-400 border-zinc-700"}`}>
              STANDALONE
            </button>
            <button onClick={() => setConfig({ ...config, standaloneMode: false })}
              className={`px-4 py-2 font-terminal text-lg border-2 transition-colors ${!config.standaloneMode ? "bg-green-600 text-black border-green-400" : "text-zinc-400 border-zinc-700"}`}>
              EMBEDDED (Mission Control)
            </button>
          </div>
          <p className="text-zinc-600 font-terminal text-xs mt-1">Standalone shows the app's own navigation. Embedded uses Mission Control's sidebar.</p>
        </div>
      </Section>

      <Section title="Plex Integration" icon="🎬">
        <div>
          <label className="block text-zinc-400 font-terminal text-sm mb-1 uppercase">Plex Server URL</label>
          <input type="text" className="w-full bg-black border-2 border-green-800 text-green-300 p-2 font-terminal text-xl focus:outline-none focus:border-green-400"
            placeholder="https://192.168.1.2:32400" value={config.plex?.url || ""}
            onChange={e => setConfig({ ...config, plex: { ...config.plex, url: e.target.value } })} />
        </div>
        <div>
          <label className="block text-zinc-400 font-terminal text-sm mb-1 uppercase">Plex Token</label>
          <input type="password" className="w-full bg-black border-2 border-green-800 text-green-300 p-2 font-terminal text-xl focus:outline-none focus:border-green-400"
            placeholder="Your X-Plex-Token" value={config.plex?.token || ""}
            onChange={e => setConfig({ ...config, plex: { ...config.plex, token: e.target.value } })} />
        </div>
      </Section>

      <Section title="Price Data" icon="📊">
        <div>
          <label className="block text-zinc-400 font-terminal text-sm mb-1 uppercase">Fetch Schedule (24h clock)</label>
          <input type="number" min={0} max={23}
            className="w-24 bg-black border-2 border-green-800 text-green-300 p-2 font-terminal text-2xl text-center focus:outline-none focus:border-green-400"
            value={config.fetchScheduleHour}
            onChange={e => setConfig({ ...config, fetchScheduleHour: parseInt(e.target.value) || 0 })} />
          <p className="text-zinc-600 font-terminal text-xs mt-1">Background price fetcher will run at this hour. Current: {config.fetchScheduleHour}:00. Note: crontab must be manually updated to match.</p>
        </div>
      </Section>

      <Section title="Platforms" icon="🕹️">
        <div>
          <p className="text-zinc-500 font-terminal text-sm mb-4">Choose which platforms to track in your vault, analytics, and goals. Defaults to the original 14 retro systems.</p>

          {/* Quick presets */}
          <div className="flex flex-wrap gap-2 mb-5">
            {[
              { label: "Retro Only (default)", platforms: RETRO_DEFAULTS, color: "bg-green-700 border-green-500" },
              { label: "All Platforms", platforms: ALL_PLATFORMS, color: "bg-blue-700 border-blue-500" },
              { label: "Nintendo Only", platforms: ["NES","SNES","Nintendo 64","Gamecube","Wii","Wii U","Nintendo Switch","Switch 2","Game Boy","Game Boy Color","Game Boy Advance","Nintendo DS","Nintendo 3DS"], color: "bg-red-800 border-red-600" },
              { label: "PlayStation Only", platforms: ["PS1","PS2","PS3","PS4","PS5","PSP","PS Vita"], color: "bg-blue-800 border-blue-600" },
              { label: "None", platforms: [], color: "bg-zinc-800 border-zinc-600" },
            ].map(preset => (
              <button key={preset.label}
                onClick={() => setConfig({ ...config, platforms: preset.platforms } as any)}
                className={`px-3 py-1.5 font-terminal text-xs border-2 text-white transition-colors ${preset.color} hover:opacity-80`}>
                {preset.label}
              </button>
            ))}
          </div>

          {/* Platform groups */}
          <div className="space-y-5">
            {PLATFORM_GROUPS.map(group => {
              const enabledInGroup = group.platforms.filter(p => ((config as any).platforms || RETRO_DEFAULTS).includes(p)).length;
              const allEnabled = enabledInGroup === group.platforms.length;
              const noneEnabled = enabledInGroup === 0;
              return (
                <div key={group.id}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-terminal text-sm text-zinc-400 uppercase">{group.icon} {group.label}</span>
                    <div className="flex gap-1">
                      <button onClick={() => {
                        const current = new Set((config as any).platforms || RETRO_DEFAULTS);
                        group.platforms.forEach(p => current.add(p));
                        setConfig({ ...config, platforms: [...current] } as any);
                      }} className="font-terminal text-xs text-zinc-600 hover:text-green-400 transition-colors px-1">+all</button>
                      <button onClick={() => {
                        const current = new Set((config as any).platforms || RETRO_DEFAULTS);
                        group.platforms.forEach(p => current.delete(p));
                        setConfig({ ...config, platforms: [...current] } as any);
                      }} className="font-terminal text-xs text-zinc-600 hover:text-red-400 transition-colors px-1">−all</button>
                    </div>
                    <span className="text-zinc-700 font-terminal text-xs ml-auto">{enabledInGroup}/{group.platforms.length}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {group.platforms.map(platform => {
                      const enabled = ((config as any).platforms || RETRO_DEFAULTS).includes(platform);
                      return (
                        <button key={platform}
                          onClick={() => {
                            const current = new Set((config as any).platforms || RETRO_DEFAULTS);
                            if (enabled) current.delete(platform); else current.add(platform);
                            setConfig({ ...config, platforms: [...current] } as any);
                          }}
                          className={`px-3 py-1.5 font-terminal text-sm border-2 transition-colors ${
                            enabled
                              ? 'bg-green-900/40 text-green-300 border-green-700'
                              : 'text-zinc-600 border-zinc-800 hover:border-zinc-600'
                          }`}>
                          {platform}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-zinc-600 font-terminal text-xs mt-4">
            {((config as any).platforms || RETRO_DEFAULTS).length} platform{((config as any).platforms || RETRO_DEFAULTS).length !== 1 ? 's' : ''} enabled.
            Changes take effect immediately after saving.
          </p>
        </div>
      </Section>

      <Section title="Scrapers" icon="🔧">
        <div>
          <label className="block text-zinc-400 font-terminal text-sm mb-2 uppercase">Craigslist City</label>
          <div className="flex gap-2 flex-wrap items-start">
            <input type="text"
              className="bg-black border-2 border-zinc-800 text-zinc-300 p-2 font-terminal text-xl w-48 focus:outline-none focus:border-green-600"
              placeholder="portland"
              value={(config as any).scrapers?.craigslistCity || ''}
              onChange={e => setConfig({ ...config, scrapers: { ...((config as any).scrapers || {}), craigslistCity: e.target.value } } as any)} />
            <div className="flex flex-wrap gap-1">
              {['portland','seattle','chicago','boston','newyork','sfbay','denver','dallas','losangeles','atlanta','miami','detroit','minneapolis'].map(c => (
                <button key={c} onClick={() => setConfig({ ...config, scrapers: { ...((config as any).scrapers || {}), craigslistCity: c } } as any)}
                  className="px-2 py-1 font-terminal text-xs border border-zinc-800 text-zinc-600 hover:text-zinc-300 hover:border-zinc-600 transition-colors">
                  {c}
                </button>
              ))}
            </div>
          </div>
          <p className="text-zinc-600 font-terminal text-xs mt-2">Used by the Craigslist scraper. Enter the subdomain slug from craigslist.org (e.g. &ldquo;portland&rdquo; for portland.craigslist.org)</p>
        </div>
        <div className="pt-2">
          <Link href="/scrapers" className="text-blue-500 hover:text-blue-400 font-terminal text-sm transition-colors">⚙️ Manage all scrapers →</Link>
        </div>
      </Section>

      <Section title="Features" icon="🎛️">
        <p className="text-zinc-500 font-terminal text-sm">Enable or disable feature groups. The navigation updates instantly to show only what you use. Collection is always on.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
          {NAV_GROUPS.filter(g => !g.alwaysOn).map(group => {
            const enabled = config.features?.[group.id as keyof Features] ?? true;
            const infoOpen = openInfoId === group.id;
            return (
              <div key={group.id} className={`border-2 transition-all relative ${
                enabled ? 'border-green-700 bg-green-900/10' : 'border-zinc-800'
              } ${!enabled ? 'opacity-60' : ''}`}>
                {/* Main toggle row */}
                <button
                  onClick={() => setConfig({ ...config, features: { ...(config.features || {}), [group.id]: !enabled } as Features })}
                  className="w-full p-4 text-left">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-terminal text-lg">{group.icon} {group.label}</span>
                    <span className={`font-terminal text-xs px-2 py-0.5 border ${
                      enabled ? 'text-green-400 border-green-700' : 'text-zinc-600 border-zinc-700'
                    }`}>{enabled ? 'ON' : 'OFF'}</span>
                  </div>
                  <p className="text-zinc-600 font-terminal text-xs">{group.description}</p>
                </button>
                {/* Info button */}
                <button
                  onClick={e => { e.stopPropagation(); setOpenInfoId(infoOpen ? null : group.id); }}
                  className="absolute top-3 right-14 w-5 h-5 rounded-full border border-zinc-600 text-zinc-500 hover:text-zinc-200 hover:border-zinc-400 font-terminal text-xs flex items-center justify-center transition-colors"
                  title="What does this feature do?">
                  ?
                </button>
                {/* Info popover */}
                {infoOpen && (
                  <div className="border-t border-zinc-700 bg-zinc-900 px-4 py-3 mx-0">
                    <p className="text-zinc-300 font-terminal text-sm mb-2">{group.description}</p>
                    <ul className="space-y-1">
                      {group.benefits.map((b, i) => (
                        <li key={i} className="flex gap-2 font-terminal text-xs text-zinc-400">
                          <span className="text-green-700 shrink-0">▶</span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 text-zinc-500 font-terminal text-xs">
                      {group.items.length} page{group.items.length !== 1 ? 's' : ''}: {group.items.map(i => i.label).join(', ')}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="Authentication" icon="🔒">
        <div className="flex items-center gap-4">
          <button onClick={() => setConfig({ ...config, auth: { ...config.auth, enabled: !config.auth?.enabled } })}
            className={`px-4 py-2 font-terminal text-xl border-2 transition-colors ${config.auth?.enabled ? "bg-green-600 text-black border-green-400" : "text-zinc-400 border-zinc-700"}`}>
            {config.auth?.enabled ? "AUTH: ENABLED" : "AUTH: DISABLED"}
          </button>
          <span className="text-zinc-500 font-terminal text-sm">Toggle to require a password to access the app</span>
        </div>
        {config.auth?.enabled && (
          <div className="space-y-3 pt-2 border-t border-zinc-800">
            <p className="text-zinc-400 font-terminal text-sm">
              Current password: <span className="text-green-400">{config.auth.passwordHash === '(set)' ? 'SET' : 'NOT SET'}</span>
            </p>
            <div>
              <label className="block text-zinc-400 font-terminal text-sm mb-1 uppercase">New Password</label>
              <input type="password" className="w-full bg-black border-2 border-green-800 text-green-300 p-2 font-terminal text-xl focus:outline-none focus:border-green-400"
                placeholder="Enter new password..." value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            </div>
            <div>
              <label className="block text-zinc-400 font-terminal text-sm mb-1 uppercase">Confirm Password</label>
              <input type="password" className="w-full bg-black border-2 border-green-800 text-green-300 p-2 font-terminal text-xl focus:outline-none focus:border-green-400"
                placeholder="Confirm new password..." value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
            </div>
            {pwError && <p className="text-red-500 font-terminal text-sm">{pwError}</p>}
            <button onClick={handlePasswordSave} className="px-4 py-2 font-terminal text-xl bg-blue-700 hover:bg-blue-600 text-white border-2 border-blue-500 transition-colors">
              SET PASSWORD
            </button>
            <p className="text-zinc-600 font-terminal text-xs">Leave blank and save to remove the password. Passwords are stored as SHA-256 hashes.</p>
          </div>
        )}
      </Section>
    </div>
  );
}
