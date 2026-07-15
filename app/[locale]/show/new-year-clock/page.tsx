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

  return createMetadata({
    description: "A live countdown to the next year.",
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
        description="A live countdown that keeps its eyes on the next January first."
        href={`/${locale}/show` as Route}
        kicker="Time study"
        title="New year clock"
      />

      <Countdown />
    </section>
  );
}
