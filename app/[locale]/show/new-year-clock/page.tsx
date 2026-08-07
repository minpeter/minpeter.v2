import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import { ShowcaseDetailHeader } from "@/components/showcase-detail-header";
import { createMetadata } from "@/shared/utils/metadata";

import { Countdown } from "./countdown";

// Deliberate Block: client-only interaction (canvas / Date.now / Math.random / network).
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  const [locale, t] = await Promise.all([getLocale(), getTranslations()]);

  return createMetadata({
    description: t("showcase.items.newYear.summary"),
    locale,
    path: "/show/new-year-clock",
    title: "minpeter | new year clock",
  });
}

export default async function Page(
  _props: PageProps<"/[locale]/show/new-year-clock">
) {
  const t = await getTranslations();

  return (
    <section className="showcase-page">
      <ShowcaseDetailHeader
        backLabel={t("back")}
        description={t("showcase.items.newYear.description")}
        href="/show"
        kicker={t("showcase.items.newYear.kicker")}
        navigationLabel={t("showcase.detailNavigationLabel", {
          title: t("showcase.items.newYear.title"),
        })}
        title={t("showcase.items.newYear.title")}
      />

      <Countdown />
    </section>
  );
}
