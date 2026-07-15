import type { Route } from "next";
import { getTranslations } from "next-intl/server";

import { ShowcaseDetailHeader } from "@/components/showcase-detail-header";
import NewMetadata from "@/shared/utils/metadata";

import { Countdown } from "./countdown";

export const metadata = NewMetadata({
  description: "A live countdown to the next year.",
  title: "minpeter | new year clock",
});

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
