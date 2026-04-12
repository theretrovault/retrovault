"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useAppConfig } from "@/components/AppConfig";
import { useDemoMode } from "@/components/DemoMode";
import { useTooltips } from "@/components/Tooltip";
import { useLogout } from "@/components/AuthGuard";
import { QuoteBanner } from "@/components/QuoteBanner";
import { NAV_GROUPS, SYSTEM_ITEMS, getEnabledGroups } from "@/data/navConfig";

export function StandaloneNav({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { appName, ownerName, features } = useAppConfig();
  const { start: startDemo } = useDemoMode();
  const { enabled: tooltipsEnabled, toggle: toggleTooltips } = useTooltips();
  const logout = useLogout();
  const [menuOpen, setMenuOpen] = useState(false);
  const [authEnabled, setAuthEnabled] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth").then(r => r.json()).then(d => setAuthEnabled(d.authEnabled)).catch(() => {});
  }, []);

  const enabledGroups = getEnabledGroups(features);
  const isActive = (href: string) => pathname === href;

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950">
      {/* Top Navigation Bar */}
      <header className="bg-black border-b-4 border-green-900 shadow-[0_4px_20px_rgba(34,197,94,0.15)] sticky top-0 z-40">
        <div className="max-w-[1800px] mx-auto px-4 py-3 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <div className="w-9 h-9 bg-green-500 rounded-sm flex items-center justify-center text-black text-xl font-bold shadow-[0_0_12px_rgba(34,197,94,0.5)] group-hover:shadow-[0_0_20px_rgba(34,197,94,0.8)] transition-all">
              👾
            </div>
            <div>
              <div className="text-green-400 font-terminal text-xl uppercase tracking-widest leading-tight drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]">
                {appName}
              </div>
              {ownerName && <div className="text-green-800 font-terminal text-xs">{ownerName}</div>}
            </div>
          </Link>

          {/* Desktop Nav — grouped dropdowns */}
          <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center flex-wrap">
            {enabledGroups.map(group => (
              <div key={group.id} className="relative group">
                <button
                  className={`flex items-center gap-1 px-3 py-2 font-terminal text-sm uppercase tracking-wide rounded-sm transition-colors border border-transparent hover:border-green-900/60 ${
                    group.items.some(i => pathname === i.href)
                      ? "text-green-300 border-green-800"
                      : "text-green-600 hover:text-green-300"
                  }`}>
                  <span>{group.icon}</span>
                  <span className="hidden xl:inline">{group.label}</span>
                  <span className="text-xs opacity-40 ml-1">▾</span>
                </button>
                {/* Dropdown */}
                <div className="absolute top-full left-0 z-50 min-w-[160px] bg-black border-2 border-green-900 shadow-[0_8px_20px_rgba(0,0,0,0.8)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  {group.items.map(item => (
                    <Link key={item.href} href={item.href}
                      className={`flex items-center gap-2 px-4 py-2 font-terminal text-sm border-b border-green-950 last:border-0 transition-colors ${
                        isActive(item.href)
                          ? "text-black bg-green-500"
                          : "text-green-400 hover:bg-green-900/30 hover:text-green-200"
                      }`}>
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
            {/* System items inline */}
            {SYSTEM_ITEMS.map(item => (
              <Link key={item.href} href={item.href}
                className={`px-3 py-2 font-terminal text-sm uppercase rounded-sm transition-colors ${
                  isActive(item.href) ? "text-black bg-green-500" : "text-zinc-600 hover:text-zinc-300"
                }`}>
                {item.icon}
              </Link>
            ))}
          </nav>

          {/* Right controls */}
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={startDemo}
              className="hidden md:flex items-center gap-1 px-3 py-2 font-terminal text-xs uppercase text-yellow-600 hover:text-yellow-400 border border-yellow-900/50 rounded-sm transition-colors">
              ▶ DEMO
            </button>
            <button onClick={toggleTooltips}
              title={tooltipsEnabled ? "Tooltips are ON — hover elements to see hints. Click to disable." : "Tooltips are OFF — click to enable hover hints throughout the app."}
              className={`hidden md:flex px-3 py-2 font-terminal text-sm border rounded-sm transition-colors ${
                tooltipsEnabled ? "text-blue-400 border-blue-800" : "text-zinc-700 border-zinc-800 hover:text-zinc-500"
              }`}>
              💡
            </button>
            {authEnabled && (
              <button onClick={logout}
                className="hidden md:flex px-3 py-2 font-terminal text-sm text-red-700 hover:text-red-500 border border-red-900/50 rounded-sm transition-colors">
                ⏻
              </button>
            )}
            {/* Mobile hamburger */}
            <button onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden p-2 text-green-500 hover:text-green-300 border border-green-800 rounded-sm">
              {menuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="lg:hidden bg-zinc-950 border-t-2 border-green-900 px-4 py-3 space-y-2 max-h-[70vh] overflow-y-auto">
            {enabledGroups.map(group => (
              <div key={group.id}>
                <button onClick={() => setOpenGroup(openGroup === group.id ? null : group.id)}
                  className="w-full flex items-center justify-between px-2 py-2 font-terminal text-sm text-zinc-400 uppercase">
                  <span>{group.icon} {group.label}</span>
                  <span>{openGroup === group.id ? "▲" : "▼"}</span>
                </button>
                {openGroup === group.id && (
                  <div className="pl-4 space-y-1 border-l border-green-900 ml-2">
                    {group.items.map(item => (
                      <Link key={item.href} href={item.href}
                        onClick={() => setMenuOpen(false)}
                        className={`flex items-center gap-2 px-3 py-2 font-terminal text-base rounded-sm transition-colors ${
                          isActive(item.href) ? "text-black bg-green-500" : "text-green-400 hover:bg-green-900/20"
                        }`}>
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div className="pt-2 border-t border-green-900 flex gap-3">
              <button onClick={startDemo} className="text-yellow-500 font-terminal text-sm px-3 py-2 border border-yellow-900/50">▶ DEMO</button>
              <button onClick={toggleTooltips} className={`font-terminal text-sm px-3 py-2 border ${tooltipsEnabled ? "text-blue-400 border-blue-700" : "text-zinc-600 border-zinc-800"}`}>💡 TIPS</button>
              <Link href="/settings" onClick={() => setMenuOpen(false)} className="text-zinc-500 font-terminal text-sm px-3 py-2 border border-zinc-800">⚙️</Link>
            </div>
          </div>
        )}
      </header>

      {/* Page content */}
      <main className="flex-1 overflow-y-auto">
        <QuoteBanner />
        <div className="max-w-[1800px] mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-green-900/20 bg-black py-3 px-6">
        <div className="max-w-[1800px] mx-auto flex justify-between items-center font-terminal text-xs text-zinc-800">
          <span>{appName}</span>
          <span className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
            ONLINE
          </span>
        </div>
      </footer>
    </div>
  );
}
