"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useUserSettings } from "@/components/providers/UserSettingsProvider";
import type { ThemeMode } from "@/types/user-settings";

type ThemeContextValue = {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_CLASS = "dark";

function applyThemeClass(theme: ThemeMode) {
  if (typeof document === "undefined") return;

  document.documentElement.classList.toggle(THEME_CLASS, theme === "dark");
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { settings, setTheme: persistTheme } = useUserSettings();
  const [theme, setThemeState] = useState<ThemeMode>(settings.theme);

  useEffect(() => {
    setThemeState(settings.theme);
    applyThemeClass(settings.theme);
  }, [settings.theme]);

  const setTheme = async (nextTheme: ThemeMode) => {
    setThemeState(nextTheme);
    applyThemeClass(nextTheme);
    await persistTheme(nextTheme);
  };

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return context;
}
