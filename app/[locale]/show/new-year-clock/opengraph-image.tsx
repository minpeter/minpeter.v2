import { getTranslations } from "next-intl/server";

import en from "@/shared/i18n/en.json";
import { createOgImageResponse } from "@/shared/og-image";
import { resolveLocale } from "@/shared/utils/metadata";

// Next reads this alt once per route (not per locale); localized alts come from page metadata.
export const alt = `minpeter | ${en.showcase.items.newYear.title}`;
export const size = { height: 630, width: 1200 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: routeLocale } = await params;
  const locale = resolveLocale(routeLocale);
  const t = await getTranslations({
    locale,
    namespace: "showcase.items.newYear",
  });

  return createOgImageResponse({
    locale,
    title: `minpeter | ${t("title")}`,
  });
}
