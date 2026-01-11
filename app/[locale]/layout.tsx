import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import type { ReactNode } from "react";
import type { routing } from "@/shared/i18n/routing";

type Locale = (typeof routing.locales)[number];

interface Props {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;

  return {
    alternates: {
      types: {
        "application/rss+xml": [
          { url: `/${locale}/rss.xml`, title: `RSS Feed (${locale})` },
        ],
      },
    },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale as Locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
