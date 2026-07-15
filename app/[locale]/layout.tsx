import type { Metadata } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { ViewTransition } from "@/components/view-transition";
import { routing } from "@/shared/i18n/routing";
import { getSiteDescription } from "@/shared/site-config";
import {
  createMetadata,
  getLocalizedPath,
  resolveLocale,
} from "@/shared/utils/metadata";

import "../globals.css";
import { RootDocument } from "../root-document";
import { metadata as rootMetadata } from "../root-metadata";

export { viewport } from "../root-metadata";
interface Props {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: routeLocale } = await params;
  const locale = resolveLocale(routeLocale);
  const t = await getTranslations({ locale });
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
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <RootDocument lang={locale}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        <ViewTransition>{children}</ViewTransition>
      </NextIntlClientProvider>
    </RootDocument>
  );
}
