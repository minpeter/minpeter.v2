"use client";

import { useEffect } from "react";

import { useTheme } from "@/components/theme-provider";

const faviconPaths = {
  dark: "/assets/favicon-dark.svg",
  light: "/assets/favicon-light.svg",
} as const;

const themeColors = {
  dark: "#0a0a0b",
  light: "#ffffff",
} as const;

export const ThemeFavicon = () => {
  const { resolvedTheme } = useTheme();
  const themeColor =
    resolvedTheme === "dark" ? themeColors.dark : themeColors.light;

  useEffect(() => {
    if (resolvedTheme !== "dark" && resolvedTheme !== "light") {
      return;
    }

    const selector = "link[data-theme-favicon]";
    let favicon = document.head.querySelector<HTMLLinkElement>(selector);

    if (!favicon) {
      favicon = document.createElement("link");
      favicon.dataset.themeFavicon = "";
      favicon.rel = "icon";
      favicon.type = "image/svg+xml";
      document.head.append(favicon);
    }

    favicon.href = `${faviconPaths[resolvedTheme]}?theme=${resolvedTheme}`;
  }, [resolvedTheme]);

  return <meta content={themeColor} name="theme-color" />;
};
