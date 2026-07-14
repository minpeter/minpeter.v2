"use client";

import { useTheme } from "next-themes";
import { useEffect } from "react";

const faviconPaths = {
  dark: "/assets/favicon-dark.svg",
  light: "/assets/favicon-light.svg",
} as const;

export const ThemeFavicon = () => {
  const { resolvedTheme } = useTheme();

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

  return null;
};
