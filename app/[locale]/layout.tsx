import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { ViewTransition } from "@/components/view-transition";
import { routing } from "@/shared/i18n/routing";
import { getSiteDescription } from "@/shared/site-config";
import { createMetadata, getLocalizedPath } from "@/shared/utils/metadata";

import "../globals.css";
import { RootDocument } from "../root-document";
import {
  metadata as rootMetadata,
  viewport as rootViewport,
} from "../root-metadata";

// Cache Components opt-out — remove after this route is adopted.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const viewport = rootViewport;

interface Props {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations();
  const baseMetadata = createMetadata({
    description: getSiteDescription(locale),
    locale,
    path: "/",
    title: "minpeter",
  });

  return {
    ...baseMetadata,
    alternates: {
      ...baseMetadata.alternates,
      types: {
        ...baseMetadata.alternates?.types,
        "application/rss+xml": [
          {
            title: `${t("common.rssFeed")} (${locale})`,
            url: getLocalizedPath(locale, "/blog/rss.xml"),
          },
        ],
      },
    },
    metadataBase: rootMetadata.metadataBase,
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale: routeLocale } = await params;

  if (!hasLocale(routing.locales, routeLocale)) {
    notFound();
  }

  const [locale, messages] = await Promise.all([getLocale(), getMessages()]);

  return (
    <RootDocument lang={locale}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        <ViewTransition>{children}</ViewTransition>
      </NextIntlClientProvider>
    </RootDocument>
  );
}
