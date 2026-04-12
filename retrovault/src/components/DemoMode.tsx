"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";

export type DemoStep = {
  id: string;
  title: string;
  description: string;
  targetSelector?: string;
  position?: "top" | "bottom" | "left" | "right" | "center";
  navigateTo?: string;
};

const DEMO_STEPS: DemoStep[] = [
  {
    id: "welcome",
    title: "Welcome to RetroVault",
    description: "This is your retro gaming empire's command center. We've built a comprehensive suite of tools to help you track, analyze, and grow your collection. Let's take a quick tour of the key features.",
    position: "center",
    navigateTo: "/",
  },
  {
    id: "vault",
    title: "🕹️ The Vault",
    description: "Your game database — 26,000+ titles across 14 platforms. Filter to OWNED to see your collection, TARGETS for games you want, or SELL for flip candidates. The platform dropdown narrows to a single system.",
    position: "center",
    navigateTo: "/inventory",
  },
  {
    id: "buy-sell-scores",
    title: "📊 Buy & Sell Scores",
    description: "Every game gets a Buy Score and Sell Score from 1–100. These factor in current price position AND 30-day price trends. Click a column header to rank your best opportunities. Green = strong signal.",
    position: "center",
    navigateTo: "/inventory",
  },
  {
    id: "field-mode",
    title: "🔦 Field Mode",
    description: "Your in-the-wild tool. Type any game title and instantly see its market price, whether you already own it (dupe alert!), and a BUY / PASS / NEGOTIATE verdict based on your asking price.",
    position: "center",
    navigateTo: "/field",
  },
  {
    id: "analytics",
    title: "📈 Analytics Dashboard",
    description: "KPI cards, platform distribution charts, top 10 most valuable, and best ROI tables. Also shows your achievement count and recent unlocks. The full picture of your collection health.",
    position: "center",
    navigateTo: "/analytics",
  },
  {
    id: "hotlist",
    title: "🔥 Hot List",
    description: "Auto-ranked flip opportunities right now. Scored by ROI × 30-day price trend × copy count. Filter by minimum ROI and platform. Your top flips are always front and center.",
    position: "center",
    navigateTo: "/hotlist",
  },
  {
    id: "pl-ledger",
    title: "💰 P&L Ledger",
    description: "Track every buy and sell. The ledger calculates realized profit, COGS, average margin, and net cash position. Log a purchase here and it syncs to your Vault automatically.",
    position: "center",
    navigateTo: "/sales",
  },
  {
    id: "achievements",
    title: "🏆 Achievement Codex",
    description: "100+ achievements across 9 categories — from Collection milestones to Secret easter eggs. They unlock automatically as you use the app. Common → Uncommon → Rare → Epic → Legendary.",
    position: "center",
    navigateTo: "/achievements",
  },
];

const STORAGE_KEY = "rv-demo-state";

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
  const router = useRouter();
  const pathname = usePathname();
  // Prevent double-navigation race condition
  const navigating = useRef(false);

  const step = isActive && currentStep < DEMO_STEPS.length ? DEMO_STEPS[currentStep] : null;

  // Restore state from sessionStorage on mount (survives soft nav & hard nav)
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const { active, stepIndex } = JSON.parse(saved);
        if (active && stepIndex < DEMO_STEPS.length) {
          setIsActive(true);
          setCurrentStep(stepIndex);
        }
      }
    } catch { /* ignore */ }
  }, []);

  // Persist state to sessionStorage whenever it changes
  useEffect(() => {
    try {
      if (isActive) {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ active: true, stepIndex: currentStep }));
      } else {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    } catch { /* ignore */ }
  }, [isActive, currentStep]);

  const exit = useCallback(() => {
    setIsActive(false);
    setCurrentStep(0);
    navigating.current = false;
    try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  }, []);

  const start = useCallback(() => {
    setCurrentStep(0);
    setIsActive(true);
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ active: true, stepIndex: 0 })); } catch { /* ignore */ }
  }, []);

  // Handle navigation when step changes
  useEffect(() => {
    if (!isActive || !step?.navigateTo) return;
    if (pathname === step.navigateTo) {
      navigating.current = false;
      return;
    }
    if (navigating.current) return;
    navigating.current = true;
    router.push(step.navigateTo);
  }, [isActive, step, pathname, router]);

  // Clear navigating flag when pathname matches current step
  useEffect(() => {
    if (step?.navigateTo && pathname === step.navigateTo) {
      navigating.current = false;
    }
  }, [pathname, step]);

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

  const pct = Math.round((currentStep / DEMO_STEPS.length) * 100);

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
            DEMO — STEP {currentStep + 1} / {DEMO_STEPS.length}
          </div>

          {/* Demo popup */}
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[120] w-full max-w-2xl px-4">
            <div className="bg-zinc-950 border-4 border-green-500 p-6 rounded-sm shadow-[0_0_40px_rgba(34,197,94,0.4)]">
              <h3 className="text-2xl text-green-400 font-terminal uppercase mb-3 tracking-widest">{step.title}</h3>
              <p className="text-zinc-300 text-base leading-relaxed mb-6">{step.description}</p>

              {/* Progress dots */}
              <div className="flex justify-center gap-2 mb-4">
                {DEMO_STEPS.map((_, i) => (
                  <div key={i} className={`h-2 rounded-full transition-all ${i === currentStep ? "bg-green-400 w-4" : i < currentStep ? "bg-green-800 w-2" : "bg-zinc-700 w-2"}`} />
                ))}
              </div>

              <div className="flex justify-between items-center">
                <button onClick={prev} disabled={currentStep === 0}
                  className="px-4 py-2 font-terminal text-xl text-zinc-400 hover:text-white disabled:opacity-30 transition-colors">
                  ◀ PREV
                </button>
                <div className="text-zinc-600 font-terminal text-sm">Press ESC to exit</div>
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
