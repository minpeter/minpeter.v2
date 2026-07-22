"use client";

import { SunIcon } from "@radix-ui/react-icons";
import { useTheme } from "next-themes";
import { FiMoon } from "react-icons/fi";

export function ModeToggle({ label }: { label: string }) {
  const { setTheme, theme } = useTheme();

  return (
    <button
      aria-label={label}
      className="relative flex h-6 w-6 items-center justify-center rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      type="button"
    >
      <SunIcon className="absolute h-3 w-3 rotate-0 scale-100 opacity-100 transition-[rotate,scale,opacity] dark:-rotate-90 dark:scale-[0.01] dark:opacity-0" />
      <FiMoon className="absolute h-3 w-3 rotate-90 scale-[0.01] opacity-0 transition-[rotate,scale,opacity] dark:rotate-0 dark:scale-100 dark:opacity-100" />
      <span className="sr-only">{label}</span>
    </button>
  );
}
