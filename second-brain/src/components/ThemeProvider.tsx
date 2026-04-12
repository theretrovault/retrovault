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
  const html = document.documentElement;

  // Set data-color attribute on <html> — CSS in globals.css maps this to vars
  html.setAttribute('data-color', colorId === 'green' ? '' : colorId);
  if (colorId === 'green') html.removeAttribute('data-color');

  // Remove all style theme classes from body, add the new one
  STYLE_THEMES.forEach(t => document.body.classList.remove(t.cssClass));
  document.body.classList.add(`theme-${styleId}`);

  // Also patch the background grid lines color for non-green themes
  const palette = COLOR_PALETTES.find(p => p.id === colorId) || COLOR_PALETTES[0];
  const gridColor = palette.primary.replace('#', '%23');
  if (styleId === 'terminal' || styleId === 'scanline') {
    document.body.style.backgroundImage = `
      linear-gradient(${palette.primaryBg} 1px, transparent 1px),
      linear-gradient(90deg, ${palette.primaryBg} 1px, transparent 1px)
    `;
  } else {
    // Other themes handle their own background in CSS
    document.body.style.backgroundImage = '';
  }
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
