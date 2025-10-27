"use client";

import { SunIcon } from "@radix-ui/react-icons";
import { useTheme } from "next-themes";
import { FiMoon } from "react-icons/fi";

export function ModeToggle() {
  const { setTheme, theme } = useTheme();

  return (
    <div
      className="relative flex h-6 w-6 cursor-pointer items-center justify-center"
      onClick={() => (theme === "dark" ? setTheme("light") : setTheme("dark"))}
    >
      <SunIcon className="dark:-rotate-90 absolute h-3 w-3 rotate-0 scale-100 transition-all dark:scale-0" />
      <FiMoon className="absolute h-3 w-3 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </div>
  );
}
