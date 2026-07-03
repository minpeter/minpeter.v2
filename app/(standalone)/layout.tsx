import type { ReactNode } from "react";
import { routing } from "@/shared/i18n/routing";
import "../globals.css";
import { RootDocument } from "../root-document";
import {
  metadata as rootMetadata,
  viewport as rootViewport,
} from "../root-metadata";

export const metadata = rootMetadata;
export const viewport = rootViewport;

export default function StandaloneRootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return <RootDocument lang={routing.defaultLocale}>{children}</RootDocument>;
}
