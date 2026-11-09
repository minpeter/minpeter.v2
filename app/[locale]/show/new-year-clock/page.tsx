import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { ShowcaseDetailHeader } from "@/components/showcase-detail-header";
import { Skeleton } from "@/components/ui/skeleton";
import { createMetadata, createSectionImage } from "@/shared/utils/metadata";

import { Countdown } from "./countdown";

export async function generateMetadata(): Promise<Metadata> {
  const [locale, t] = await Promise.all([getLocale(), getTranslations()]);
  const title = `minpeter | ${t("showcase.items.newYear.title")}`;

  return createMetadata({
    description: t("showcase.items.newYear.summary"),
    image: createSectionImage(locale, "/show/new-year-clock", title),
    locale,
    path: "/show/new-year-clock",
    title,
  });
}

export default async function Page() {
  const t = await getTranslations();

  return (
    <section className="showcase-page" data-testid="showcase-detail-shell">
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

      <Suspense fallback={<Skeleton className="h-40 w-full rounded-lg" />}>
        <Countdown />
      </Suspense>
    </section>
  );
}
