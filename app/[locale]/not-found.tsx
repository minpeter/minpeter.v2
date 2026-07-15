import type { Metadata, Route } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import { NotFoundPage } from "@/components/not-found-page";
import { createMetadata, getLocalizedPath } from "@/shared/utils/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const [locale, t] = await Promise.all([getLocale(), getTranslations()]);

  return createMetadata({
    description: t("notFound.description"),
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
    <NotFoundPage
      backHref={`/${locale}` as Route}
      backLabel={t("backToHome")}
      description={t("notFound.description")}
      navigationLabel={t("notFound.navigationLabel")}
      title={t("notFound.title")}
    />
  );
}
