import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { ShowcaseDetailHeader } from "@/components/showcase-detail-header";
import { Skeleton } from "@/components/ui/skeleton";
import { createMetadata } from "@/shared/utils/metadata";

import AnimatedText from "./animated-text";

export async function generateMetadata(): Promise<Metadata> {
  const [locale, t] = await Promise.all([getLocale(), getTranslations()]);

  return createMetadata({
    description: t("showcase.items.dynamicText.summary"),
    locale,
    path: "/show/dynamic-hacked-text",
    title: "minpeter | dynamic hacked text",
  });
}

export default async function Page() {
  const t = await getTranslations();

  return (
    <section className="showcase-page" data-testid="showcase-detail-shell">
      <ShowcaseDetailHeader
        backLabel={t("back")}
        description={t("showcase.items.dynamicText.description")}
        href="/show"
        kicker={t("showcase.items.dynamicText.kicker")}
        navigationLabel={t("showcase.detailNavigationLabel", {
          title: t("showcase.items.dynamicText.title"),
        })}
        title={t("showcase.items.dynamicText.title")}
      />

      <div className="flex min-h-56 items-center justify-center rounded-lg border border-foreground/10 bg-secondary/35 px-5">
        <Suspense fallback={<Skeleton className="h-10 w-48" />}>
          <AnimatedText data={"Hello world"} />
        </Suspense>
      </div>
    </section>
  );
}
