import type { Metadata, Route } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import { NotFoundPage } from "@/components/not-found-page";
import { getBaseUrl } from "@/shared/env";
import { createMetadata, getLocalizedPath } from "@/shared/utils/metadata";

import "./globals.css";
import { RootDocument } from "./root-document";

export async function generateMetadata(): Promise<Metadata> {
  const [locale, t] = await Promise.all([getLocale(), getTranslations()]);

  return createMetadata({
    description: t("notFound.description"),
    image: {
      alt: "minpeter | 404",
      url: new URL(
        getLocalizedPath(locale, "/og/not-found"),
        getBaseUrl()
      ).toString(),
    },
    locale,
    title: "minpeter | 404",
  });
}

export default async function GlobalNotFound() {
  const [locale, t] = await Promise.all([getLocale(), getTranslations()]);

  return (
    <RootDocument lang={locale}>
      <NotFoundPage
        backHref={getLocalizedPath(locale, "/") as Route}
        backLabel={t("backToHome")}
        description={t("notFound.description")}
        navigationLabel={t("notFound.navigationLabel")}
        showLanguageSelector={false}
        title={t("notFound.title")}
      />
    </RootDocument>
  );
}
