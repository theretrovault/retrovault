"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

const TOOLTIP_KEY = "tooltipsEnabled";

type TooltipContextType = {
  enabled: boolean;
  toggle: () => void;
};

const TooltipContext = createContext<TooltipContextType>({ enabled: false, toggle: () => {} });

export const useTooltips = () => useContext(TooltipContext);

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(localStorage.getItem(TOOLTIP_KEY) === "true");
  }, []);

  const toggle = () => {
    setEnabled(v => {
      localStorage.setItem(TOOLTIP_KEY, (!v).toString());
      return !v;
    });
  };

  return (
    <TooltipContext.Provider value={{ enabled, toggle }}>
      {children}
    </TooltipContext.Provider>
  );
}

// A tooltip wrapper component
export function Tip({ text, children, className }: { text: string; children: React.ReactNode; className?: string }) {
  const { enabled } = useTooltips();
  if (!enabled) return <>{children}</>;
  return (
    <div className={`group relative inline-block ${className ?? ""}`}>
      {children}
      <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 hidden group-hover:block w-max max-w-xs">
        <div className="bg-zinc-900 border border-green-700 text-green-300 font-terminal text-sm p-2 rounded-sm shadow-lg whitespace-normal text-center">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-900" />
        </div>
      </div>
    </div>
  );
}
