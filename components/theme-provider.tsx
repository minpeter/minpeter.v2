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

import { hasStoredTheme, readStoredTheme } from "@/shared/theme-init";

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
    const sync = () => {
      let resolved: Theme = defaultTheme;
      try {
        resolved = readStoredTheme(defaultTheme);
      } catch {
        // ignore
      }
      setThemeState(resolved);
      applyResolvedTheme(resolved);
    };
    sync();

    // With no saved choice the site tracks the OS, including live switches.
    const query = window.matchMedia?.("(prefers-color-scheme: dark)");
    const handleChange = () => {
      let pinned = false;
      try {
        pinned = hasStoredTheme();
      } catch {
        // ignore
      }
      if (!pinned) {
        sync();
      }
    };
    query?.addEventListener("change", handleChange);
    return () => query?.removeEventListener("change", handleChange);
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
