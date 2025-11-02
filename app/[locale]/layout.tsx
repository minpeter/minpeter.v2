import { RootProvider } from "fumadocs-ui/provider/next";
import { notFound } from "next/navigation";
import { SUPPORTED_LOCALES, type SupportedLocale } from "@/proxy";
import { I18nProviderClient } from "@/shared/i18n/client";
import { getStaticParams } from "@/shared/i18n/server";

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
