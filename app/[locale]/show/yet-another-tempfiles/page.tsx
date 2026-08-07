import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { ShowcaseDetailHeader } from "@/components/showcase-detail-header";
import { Skeleton } from "@/components/ui/skeleton";
import { createMetadata } from "@/shared/utils/metadata";

import TmpfUI from "./tmpf";

export async function generateMetadata(): Promise<Metadata> {
  const [locale, t] = await Promise.all([getLocale(), getTranslations()]);

  return createMetadata({
    description: t("showcase.items.tempfiles.summary"),
    locale,
    path: "/show/yet-another-tempfiles",
    title: "minpeter | yet another tempfiles",
  });
}

export default async function Page() {
  const t = await getTranslations();

  return (
    <section className="showcase-page" data-testid="showcase-detail-shell">
      <ShowcaseDetailHeader
        backLabel={t("back")}
        description={t("showcase.items.tempfiles.description")}
        href="/show"
        kicker={t("showcase.items.tempfiles.kicker")}
        navigationLabel={t("showcase.detailNavigationLabel", {
          title: t("showcase.items.tempfiles.title"),
        })}
        title={t("showcase.items.tempfiles.title")}
      />

      <div className="rounded-lg border border-foreground/10 bg-secondary/25 p-5 sm:p-6">
        <Suspense fallback={<Skeleton className="h-48 w-full" />}>
          <TmpfUI />
        </Suspense>
      </div>
      <p className="mt-3 text-[0.6875rem] text-muted-foreground leading-relaxed">
        {t("showcase.items.tempfiles.notice")}
      </p>
    </section>
  );
}
