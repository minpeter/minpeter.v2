import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import { ShowcaseDetailHeader } from "@/components/showcase-detail-header";
import { createMetadata } from "@/shared/utils/metadata";

import TmpfUI from "./tmpf";

// Deliberate Block: client-only interaction (canvas / Date.now / Math.random / network).
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  const [locale, t] = await Promise.all([getLocale(), getTranslations()]);

  return createMetadata({
    description: t("showcase.items.tempfiles.summary"),
    locale,
    path: "/show/yet-another-tempfiles",
    title: "minpeter | yet another tempfiles",
  });
}

export default async function Page(
  _props: PageProps<"/[locale]/show/yet-another-tempfiles">
) {
  const t = await getTranslations();

  return (
    <section className="showcase-page">
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
        <TmpfUI />
      </div>
      <p className="mt-3 text-[0.6875rem] text-muted-foreground leading-relaxed">
        {t("showcase.items.tempfiles.notice")}
      </p>
    </section>
  );
}
