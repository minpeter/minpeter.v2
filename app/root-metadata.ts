import type { Viewport } from "next";

import { getBaseUrl } from "@/shared/env";
import { routing } from "@/shared/i18n/routing";
import { getSiteDescription } from "@/shared/site-config";
import NewMetadata from "@/shared/utils/metadata";

export const metadata = {
  ...NewMetadata({
    description: getSiteDescription(routing.defaultLocale),
    locale: routing.defaultLocale,
    path: "/",
    title: "minpeter",
  }),
  metadataBase: new URL(getBaseUrl()),
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { color: "#ffffff", media: "(prefers-color-scheme: light)" },
    { color: "#0a0a0b", media: "(prefers-color-scheme: dark)" },
  ],
};
