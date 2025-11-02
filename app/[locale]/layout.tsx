import { RootProvider } from "fumadocs-ui/provider/next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";

import { setRequestLocale } from "next-intl/server";

import { routing } from "@/shared/i18n/routing";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout(props: LayoutProps<"/[locale]">) {
  const { locale } = await props.params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale); // Enable static rendering

  return (
    <NextIntlClientProvider>
      <RootProvider i18n={{ locale }}>{props.children}</RootProvider>
    </NextIntlClientProvider>
  );
}
