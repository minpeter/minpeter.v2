import type { Metadata, Route } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import Header from "@/components/header";
import { createMetadata, getLocalizedPath } from "@/shared/utils/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();

  return createMetadata({
    description: "Page not found :/",
    image: {
      alt: "minpeter | 404",
      url: getLocalizedPath(locale, "/og/not-found"),
    },
    locale,
    title: "minpeter | 404",
  });
}

export default async function NotFound() {
  const [locale, t] = await Promise.all([getLocale(), getTranslations()]);
  return (
    <section>
      <Header
        description={t("404")}
        link={{ href: `/${locale}` as Route, text: t("backToHome") }}
        title="404"
      />
    </section>
  );
}
