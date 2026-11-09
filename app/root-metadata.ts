import type { Viewport } from "next";

import { getBaseUrl } from "@/shared/env";
import { routing } from "@/shared/i18n/routing";
import { getSiteDescription } from "@/shared/site-config";
import { createMetadata } from "@/shared/utils/metadata";

export const metadata = {
  ...createMetadata({
    description: getSiteDescription(routing.defaultLocale),
    locale: routing.defaultLocale,
    path: "/",
    title: "minpeter",
  }),
  metadataBase: new URL(getBaseUrl()),
};

export const viewport: Viewport = {
  colorScheme: "light dark",
};
