"use client";

import { SunIcon } from "@radix-ui/react-icons";
import { useTheme } from "next-themes";
import { FiMoon } from "react-icons/fi";

export function ModeToggle() {
  const { setTheme, theme } = useTheme();

  const toggleTheme = () =>
    theme === "dark" ? setTheme("light") : setTheme("dark");

  return (
    <button
      aria-label="Toggle theme"
      className="relative flex h-6 w-6 items-center justify-center"
      onClick={toggleTheme}
      type="button"
    >
      <SunIcon className="absolute h-3 w-3 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <FiMoon className="absolute h-3 w-3 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
