import { RootProvider } from "fumadocs-ui/provider/next";

import { I18nProviderClient } from "@/locales/client";
import { getStaticParams } from "@/locales/server";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return getStaticParams();
}

export default async function RootLayout(props: LayoutProps<"/[locale]">) {
  const { locale } = await props.params;

  if (!locale.includes(locale)) {
    notFound();
  }

  return (
    <I18nProviderClient locale={locale}>
      <RootProvider i18n={{ locale }}>{props.children}</RootProvider>
    </I18nProviderClient>
  );
}
