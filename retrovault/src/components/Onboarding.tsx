"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { RETRO_DEFAULTS } from "@/data/platformGroups";

const ONBOARDING_KEY = "rv-onboarding-done";

type Step = {
  id: string; title: string; icon: string; description: string;
  action?: { label: string; href?: string; onClick?: () => void };
};

const STEPS: Step[] = [
  {
    id: "welcome",
    title: "Welcome to RetroVault!",
    icon: "👾",
    description: "You've got a spreadsheet. You hate your spreadsheet.\n\nRetroVault is the tool that spreadsheet could never be. Let's get you set up in 4 quick steps.",
  },
  {
    id: "platforms",
    title: "Choose Your Platforms",
    icon: "🕹️",
    description: "RetroVault defaults to 14 classic retro systems — but you can add any platform from Atari 2600 to PS5. Go to Settings → Platforms to customize your collection scope.",
    action: { label: "Open Platform Settings", href: "/settings" },
  },
  {
    id: "games",
    title: "Add Your First Game",
    icon: "🎮",
    description: "Head to the Vault and click '+ ADD ASSET' to add your first game. Or import a CSV if you've got a spreadsheet. Prices pull automatically from PriceCharting.",
    action: { label: "Go to Vault", href: "/inventory" },
  },
  {
    id: "prices",
    title: "Set Up Price Fetching",
    icon: "📊",
    description: "RetroVault can automatically fetch market prices nightly. Go to the Scraper Control Center, enable the PriceCharting scraper, and hit Run Now to fetch your first prices.",
    action: { label: "Open Scrapers", href: "/scrapers" },
  },
  {
    id: "done",
    title: "You're Ready!",
    icon: "🚀",
    description: "Your command center is set. Explore Field Mode for garage sale hunting, the Hot List for flip opportunities, and the Field Guide for hunting tips from experienced collectors.",
    action: { label: "Explore the Guide", href: "/guide" },
  },
];

export function Onboarding() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);
  const [hasGames, setHasGames] = useState<boolean | null>(null);

  useEffect(() => {
    const done = localStorage.getItem(ONBOARDING_KEY);
    if (!done) {
      // Check if user already has games (returning user, data reset, etc.)
      fetch('/api/inventory')
        .then(r => r.json())
        .then(d => {
          const owned = Array.isArray(d) ? d.filter((i: any) => (i.copies || []).length > 0).length : 0;
          setHasGames(owned > 0);
          if (owned === 0) setShow(true); // Only show to fresh installs
        })
        .catch(() => setShow(true));
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(ONBOARDING_KEY, "done");
    setShow(false);
  };

  if (!show || hasGames === null) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const progress = ((step) / (STEPS.length - 1)) * 100;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[160] p-4">
      <div className="bg-zinc-950 border-4 border-green-700 w-full max-w-lg shadow-[0_0_40px_rgba(34,197,94,0.3)]">
        {/* Progress */}
        <div className="h-1 bg-zinc-800">
          <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>

        {/* Step indicator */}
        <div className="flex justify-center gap-2 pt-4 px-6">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all ${
              i === step ? 'bg-green-400 w-6' : i < step ? 'bg-green-800 w-2' : 'bg-zinc-700 w-2'
            }`} />
          ))}
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          <div className="text-6xl mb-4">{current.icon}</div>
          <h2 className="text-green-400 font-terminal text-2xl uppercase tracking-widest mb-4">{current.title}</h2>
          <p className="text-zinc-300 font-terminal text-base leading-relaxed whitespace-pre-line mb-6">
            {current.description}
          </p>

          {current.action && (
            <Link href={current.action.href || '#'} onClick={dismiss}
              className="inline-block mb-4 px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-terminal text-sm border border-zinc-600 transition-colors">
              {current.action.label} →
            </Link>
          )}
        </div>

        {/* Navigation */}
        <div className="border-t border-zinc-900 p-4 flex justify-between items-center">
          <button onClick={dismiss}
            className="text-zinc-600 hover:text-zinc-400 font-terminal text-sm transition-colors">
            Skip setup
          </button>

          <div className="flex gap-3">
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)}
                className="px-4 py-2 font-terminal text-sm text-zinc-400 border border-zinc-700 hover:border-zinc-500 transition-colors">
                ◀ Back
              </button>
            )}
            {isLast ? (
              <button onClick={dismiss}
                className="px-6 py-2 bg-green-700 hover:bg-green-600 text-black font-terminal text-base font-bold border-2 border-green-500 transition-colors">
                LET'S GO! 👾
              </button>
            ) : (
              <button onClick={() => setStep(s => s + 1)}
                className="px-6 py-2 bg-green-700 hover:bg-green-600 text-black font-terminal text-base font-bold border-2 border-green-500 transition-colors">
                NEXT ▶
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
