"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { COLOR_PALETTES, STYLE_THEMES, DEFAULT_THEME } from "@/data/themes";

const THEME_KEY = "rv-theme";

type ThemeState = { colorId: string; styleId: string };
type ThemeContextType = { theme: ThemeState; setTheme: (t: ThemeState) => void };

const ThemeContext = createContext<ThemeContextType>({
  theme: DEFAULT_THEME,
  setTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

function applyTheme(colorId: string, styleId: string) {
  const palette = COLOR_PALETTES.find(p => p.id === colorId) || COLOR_PALETTES[0];
  const root = document.documentElement;

  root.style.setProperty("--color-primary", palette.primary);
  root.style.setProperty("--color-primary-dark", palette.primaryDark);
  root.style.setProperty("--color-primary-glow", palette.primaryGlow);
  root.style.setProperty("--color-primary-bg", palette.primaryBg);
  root.style.setProperty("--color-text", palette.text);
  root.style.setProperty("--color-text-muted", palette.textMuted);
  root.style.setProperty("--color-border", palette.border);
  root.style.setProperty("--color-bg-base", palette.bgBase);
  root.style.setProperty("--color-bg-card", palette.bgCard);

  // Remove all style theme classes
  STYLE_THEMES.forEach(t => document.body.classList.remove(t.cssClass));
  // Add the selected style class
  document.body.classList.add(`theme-${styleId}`);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeState>(DEFAULT_THEME);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(THEME_KEY) || "null");
      if (saved) {
        setThemeState(saved);
        applyTheme(saved.colorId, saved.styleId);
      } else {
        applyTheme(DEFAULT_THEME.colorId, DEFAULT_THEME.styleId);
      }
    } catch {
      applyTheme(DEFAULT_THEME.colorId, DEFAULT_THEME.styleId);
    }
  }, []);

  const setTheme = (t: ThemeState) => {
    setThemeState(t);
    localStorage.setItem(THEME_KEY, JSON.stringify(t));
    applyTheme(t.colorId, t.styleId);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
