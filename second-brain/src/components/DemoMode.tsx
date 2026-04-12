"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export type DemoStep = {
  id: string;
  title: string;
  description: string;
  targetSelector?: string; // CSS selector of element to spotlight
  position?: "top" | "bottom" | "left" | "right" | "center";
  navigateTo?: string; // path to navigate to before showing this step
};

const DEMO_STEPS: DemoStep[] = [
  {
    id: "welcome",
    title: "Welcome to M1SS10N C0NTR0L",
    description: "This is your retro gaming empire's command center. We've built a comprehensive suite of tools to help you track, analyze, and grow your collection. Let's take a quick tour of the key features.",
    targetSelector: undefined,
    position: "center",
    navigateTo: "/inventory",
  },
  {
    id: "vault-filters",
    title: "🔍 The Vault — Filter & Search",
    description: "The Vault is your game database. It contains 26,000+ titles across all your platforms. Use FILTER: OWNED to see your collection, FILTER: TARGETS for games you want to acquire, or ACTION: SELL (DUPS) to find flip candidates. The SYSTEM filter narrows to a single platform.",
    targetSelector: ".vault-filters",
    position: "bottom",
    navigateTo: "/inventory",
  },
  {
    id: "buy-sell-scores",
    title: "📊 Buy & Sell Scores",
    description: "Every game gets a Buy Score and Sell Score from 1-100. These are normalized across your entire catalog and factor in both current price position AND 30-day price trends. A green dot means strong signal — click the column header to rank your best opportunities.",
    targetSelector: ".score-columns",
    position: "top",
    navigateTo: "/inventory",
  },
  {
    id: "price-modal",
    title: "💬 Game Detail Modal",
    description: "Click any game title to see full market pricing (Loose, CIB, New, Graded), what you paid per copy, 7-day and 30-day trends, and who in your critics circle has favorited or regretted this game.",
    targetSelector: ".vault-table",
    position: "center",
    navigateTo: "/inventory",
  },
  {
    id: "analytics",
    title: "📈 Analytics Dashboard",
    description: "The Analytics tab gives you KPI cards, platform distribution charts, Top 10 Most Valuable, and Top 10 Best ROI tables. If you've added Critics, you'll also see Favorites & Regrets breakdowns by brand and platform.",
    targetSelector: ".analytics-header",
    position: "bottom",
    navigateTo: "/analytics",
  },
  {
    id: "pl-ledger",
    title: "💰 P&L Ledger",
    description: "Track every game you buy and sell. The ledger calculates your realized profit, COGS, average margin, and net cash position. Adding a purchase here also syncs it to your Vault Inventory automatically.",
    targetSelector: ".pl-header",
    position: "bottom",
    navigateTo: "/sales",
  },
  {
    id: "target-radar",
    title: "🎯 Target Radar",
    description: "Set buy-below price targets for games you want to acquire. The system cross-references your targets against live market prices and fires a green BUY NOW alert when a game's price drops to or below your threshold.",
    targetSelector: ".radar-header",
    position: "bottom",
    navigateTo: "/watchlist",
  },
  {
    id: "goals",
    title: "🏆 Collection Goals",
    description: "Track your completion progress per platform with color-coded progress bars. Set priority levels (1/2/3) to sort your most important collections to the top. Click any platform name for CPU specs, release year, and daily trivia facts.",
    targetSelector: ".goals-header",
    position: "bottom",
    navigateTo: "/goals",
  },
];

type DemoContextType = {
  isActive: boolean;
  currentStep: number;
  totalSteps: number;
  step: DemoStep | null;
  start: () => void;
  exit: () => void;
  next: () => void;
  prev: () => void;
};

const DemoContext = createContext<DemoContextType>({
  isActive: false, currentStep: 0, totalSteps: DEMO_STEPS.length,
  step: null, start: () => {}, exit: () => {}, next: () => {}, prev: () => {},
});

export const useDemoMode = () => useContext(DemoContext);

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const step = isActive && currentStep < DEMO_STEPS.length ? DEMO_STEPS[currentStep] : null;

  const start = useCallback(() => {
    setCurrentStep(0);
    setIsActive(true);
  }, []);

  const exit = useCallback(() => {
    setIsActive(false);
    setCurrentStep(0);
  }, []);

  const next = useCallback(() => {
    if (currentStep < DEMO_STEPS.length - 1) {
      setCurrentStep(s => s + 1);
    } else {
      exit();
    }
  }, [currentStep, exit]);

  const prev = useCallback(() => {
    if (currentStep > 0) setCurrentStep(s => s - 1);
  }, [currentStep]);

  // ESC to exit
  useEffect(() => {
    if (!isActive) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") exit(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isActive, exit]);

  // Navigate when step changes
  useEffect(() => {
    if (!step?.navigateTo) return;
    const currentPath = window.location.pathname;
    if (currentPath !== step.navigateTo) {
      window.location.href = step.navigateTo + "?demo=true&step=" + currentStep;
    }
  }, [step, currentStep]);

  const pct = Math.round(((currentStep) / DEMO_STEPS.length) * 100);

  return (
    <DemoContext.Provider value={{ isActive, currentStep, totalSteps: DEMO_STEPS.length, step, start, exit, next, prev }}>
      {children}
      {isActive && step && (
        <>
          {/* Dark overlay */}
          <div className="fixed inset-0 bg-black/70 z-[100] pointer-events-none" />

          {/* Progress bar */}
          <div className="fixed top-0 left-0 right-0 z-[110] h-1 bg-zinc-800">
            <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>

          {/* Exit button */}
          <button onClick={exit}
            className="fixed top-4 right-4 z-[120] bg-red-700 hover:bg-red-600 text-white font-terminal text-lg px-4 py-2 border-2 border-red-500 shadow-lg transition-colors">
            ✕ EXIT DEMO
          </button>

          {/* Step counter */}
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[120] bg-black border-2 border-green-700 font-terminal text-green-400 text-lg px-4 py-1">
            DEMO MODE — STEP {currentStep + 1} / {DEMO_STEPS.length}
          </div>

          {/* Demo popup */}
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[120] w-full max-w-2xl px-4">
            <div className="bg-zinc-950 border-4 border-green-500 p-6 rounded-sm shadow-[0_0_40px_rgba(34,197,94,0.4)]">
              <h3 className="text-2xl text-green-400 font-terminal uppercase mb-3 tracking-widest">{step.title}</h3>
              <p className="text-zinc-300 text-base leading-relaxed mb-6">{step.description}</p>

              {/* Progress dots */}
              <div className="flex justify-center gap-2 mb-4">
                {DEMO_STEPS.map((_, i) => (
                  <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === currentStep ? "bg-green-400 w-4" : i < currentStep ? "bg-green-800" : "bg-zinc-700"}`} />
                ))}
              </div>

              <div className="flex justify-between items-center">
                <button onClick={prev} disabled={currentStep === 0}
                  className="px-4 py-2 font-terminal text-xl text-zinc-400 hover:text-white disabled:opacity-30 transition-colors">
                  ◀ PREV
                </button>
                <div className="text-zinc-600 font-terminal text-sm">Press ESC to exit at any time</div>
                <button onClick={next}
                  className="px-6 py-2 font-terminal text-xl bg-green-600 hover:bg-green-500 text-black font-bold transition-colors shadow-[0_0_10px_rgba(34,197,94,0.4)]">
                  {currentStep === DEMO_STEPS.length - 1 ? "FINISH ✓" : "NEXT ▶"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </DemoContext.Provider>
  );
}
