"use client";

import { SunIcon } from "@radix-ui/react-icons";
import { useCallback } from "react";
import { FiMoon } from "react-icons/fi";

import { useTheme } from "@/components/theme-provider";

export function ModeToggle({ label }: { label: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const handleToggleTheme = useCallback(() => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }, [resolvedTheme, setTheme]);

  return (
    <button
      aria-label={label}
      className="focus-visible:ring-ring relative flex h-6 w-6 items-center justify-center rounded focus-visible:ring-2 focus-visible:outline-none"
      onClick={handleToggleTheme}
      type="button"
    >
      <SunIcon className="absolute h-3 w-3 scale-100 rotate-0 opacity-100 transition-[rotate,scale,opacity] dark:scale-[0.01] dark:-rotate-90 dark:opacity-0" />
      <FiMoon className="absolute h-3 w-3 scale-[0.01] rotate-90 opacity-0 transition-[rotate,scale,opacity] dark:scale-100 dark:rotate-0 dark:opacity-100" />
      <span className="sr-only">{label}</span>
    </button>
  );
}
