import type { Metadata, Route } from "next";
import { getTranslations } from "next-intl/server";

import { ShowcaseDetailHeader } from "@/components/showcase-detail-header";
import { createMetadata, resolveLocale } from "@/shared/utils/metadata";

import { Countdown } from "./countdown";

export async function generateMetadata(
  props: PageProps<"/[locale]/show/new-year-clock">
): Promise<Metadata> {
  const { locale: routeLocale } = await props.params;
  const locale = resolveLocale(routeLocale);
  const t = await getTranslations({ locale });

  return createMetadata({
    description: t("showcase.items.newYear.summary"),
    locale,
    path: "/show/new-year-clock",
    title: "minpeter | new year clock",
  });
}

export default async function Page(
  props: PageProps<"/[locale]/show/new-year-clock">
) {
  const [{ locale }, t] = await Promise.all([props.params, getTranslations()]);

  return (
    <section className="showcase-page">
      <ShowcaseDetailHeader
        backLabel={t("back")}
        description={t("showcase.items.newYear.description")}
        href={`/${locale}/show` as Route}
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
