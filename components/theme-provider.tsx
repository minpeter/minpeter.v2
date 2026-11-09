"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { syncThemeColorMeta } from "@/shared/theme-init";

const STORAGE_KEY = "theme";

type Theme = "light" | "dark";

interface ThemeContextValue {
  resolvedTheme: Theme | undefined;
  setTheme: (theme: Theme | string) => void;
  theme: Theme | undefined;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function applyResolvedTheme(resolved: Theme) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(resolved);
  root.style.colorScheme = resolved;
  syncThemeColorMeta(resolved);
}

export function ThemeProvider({
  children,
  defaultTheme = "light",
}: {
  children: ReactNode;
  defaultTheme?: Theme;
}) {
  const [theme, setThemeState] = useState<Theme | undefined>(undefined);

  useEffect(() => {
    let initial: Theme = defaultTheme;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "light" || stored === "dark") {
        initial = stored;
      }
    } catch {
      // ignore
    }
    setThemeState(initial);
    applyResolvedTheme(initial);
  }, [defaultTheme]);

  const setTheme = useCallback((next: Theme | string) => {
    const value: Theme = next === "dark" ? "dark" : "light";
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // ignore
    }
    setThemeState(value);
    applyResolvedTheme(value);
  }, []);

  const value = useMemo(
    () => ({ resolvedTheme: theme, setTheme, theme }),
    [setTheme, theme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return {
      resolvedTheme: undefined,
      setTheme: () => {
        // no-op outside provider
      },
      theme: undefined,
    };
  }
  return ctx;
}
