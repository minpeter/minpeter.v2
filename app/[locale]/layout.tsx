import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";
import { ViewTransition } from "@/components/view-transition";
import { routing } from "@/shared/i18n/routing";
import "../globals.css";
import { RootDocument } from "../root-document";
import {
  metadata as rootMetadata,
  viewport as rootViewport,
} from "../root-metadata";

type Locale = (typeof routing.locales)[number];

export const viewport = rootViewport;

interface Props {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;

  return {
    ...rootMetadata,
    alternates: {
      ...rootMetadata.alternates,
      types: {
        ...rootMetadata.alternates?.types,
        "application/rss+xml": [
          { url: `/${locale}/blog/rss.xml`, title: `RSS Feed (${locale})` },
        ],
      },
    },
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
      <NextIntlClientProvider locale={locale as Locale} messages={messages}>
        <ViewTransition>{children}</ViewTransition>
      </NextIntlClientProvider>
    </RootDocument>
  );
}
