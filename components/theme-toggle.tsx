"use client";

import { SunIcon } from "@radix-ui/react-icons";
import { useTheme } from "next-themes";
import * as React from "react";
import { FiMoon } from "react-icons/fi";

export function ModeToggle() {
  const { setTheme, theme } = useTheme();

  return (
    <div
      className="relative flex h-6 w-6 cursor-pointer items-center justify-center"
      onClick={() => (theme === "dark" ? setTheme("light") : setTheme("dark"))}
    >
      <SunIcon className="absolute h-3 w-3 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
      <FiMoon className="absolute h-3 w-3 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
      <span className="sr-only">Toggle theme</span>
    </div>
  );
}
