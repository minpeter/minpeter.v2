import { RootProvider } from "fumadocs-ui/provider/next";
import { notFound } from "next/navigation";

import { I18nProviderClient } from "@/locales/client";
import { getStaticParams } from "@/locales/server";
import { SUPPORTED_LOCALES, SupportedLocale } from "@/proxy";

export function generateStaticParams() {
  return getStaticParams();
}

export default async function RootLayout(props: LayoutProps<"/[locale]">) {
  const { locale } = await props.params;

  if (!SUPPORTED_LOCALES.includes(locale as SupportedLocale)) {
    notFound();
  }

  return (
    <I18nProviderClient locale={locale}>
      <RootProvider i18n={{ locale }}>{props.children}</RootProvider>
    </I18nProviderClient>
  );
}
