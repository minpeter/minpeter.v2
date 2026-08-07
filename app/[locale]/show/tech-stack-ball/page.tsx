import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { ShowcaseDetailHeader } from "@/components/showcase-detail-header";
import { Skeleton } from "@/components/ui/skeleton";
import { createMetadata } from "@/shared/utils/metadata";

import { PlaygroundWrapper } from "./playground-wrapper";

export async function generateMetadata(): Promise<Metadata> {
  const [locale, t] = await Promise.all([getLocale(), getTranslations()]);

  return createMetadata({
    description: t("showcase.items.techStack.summary"),
    locale,
    path: "/show/tech-stack-ball",
    title: "minpeter | tech stack ball",
  });
}

export default async function Page() {
  const t = await getTranslations();

  return (
    <section className="showcase-page" data-testid="showcase-detail-shell">
      <ShowcaseDetailHeader
        backLabel={t("back")}
        description={t("showcase.items.techStack.description")}
        href="/show"
        kicker={t("showcase.items.techStack.kicker")}
        navigationLabel={t("showcase.detailNavigationLabel", {
          title: t("showcase.items.techStack.title"),
        })}
        title={t("showcase.items.techStack.title")}
      />

      <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-lg" />}>
        <PlaygroundWrapper
          className="rounded-none border-0 bg-transparent shadow-none"
          h={400}
          w={800}
        />
      </Suspense>
    </section>
  );
}
