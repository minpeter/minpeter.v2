import type { Metadata, Route } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import Header from "@/components/header";
import NewMetadata, { getLocalizedPath } from "@/shared/utils/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();

  return NewMetadata({
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
        link={{ href: `/${locale}/blog` as Route, text: t("backToBlog") }}
        title="404"
      />
    </section>
  );
}
