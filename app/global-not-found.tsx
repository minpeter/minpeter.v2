import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import { NotFoundPage } from "@/components/not-found-page";
import {
  createNotFoundMetadata,
  getLocalizedPath,
  resolveLocale,
} from "@/shared/utils/metadata";

import "./globals.css";
import { RootDocument } from "./root-document";

export async function generateMetadata(): Promise<Metadata> {
  const [locale, t] = await Promise.all([getLocale(), getTranslations()]);

  return createNotFoundMetadata({
    absoluteImage: true,
    description: t("notFound.description"),
    locale,
  });
}

export default async function GlobalNotFound() {
  const rawLocale = await getLocale();
  const locale = resolveLocale(rawLocale);
  const t = await getTranslations({ locale });

  return (
    <RootDocument lang={locale}>
      <NotFoundPage
        backHref={getLocalizedPath(locale, "/")}
        backLabel={t("backToHome")}
        description={t("notFound.description")}
        navigationLabel={t("notFound.navigationLabel")}
        showLanguageSelector={false}
        title={t("notFound.title")}
      />
    </RootDocument>
  );
}
