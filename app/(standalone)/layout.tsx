import type { ReactNode } from "react";

import { routing } from "@/shared/i18n/routing";

import "../globals.css";
import { RootDocument } from "../root-document";

export { metadata, viewport } from "../root-metadata";

export default function StandaloneRootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return <RootDocument lang={routing.defaultLocale}>{children}</RootDocument>;
}
