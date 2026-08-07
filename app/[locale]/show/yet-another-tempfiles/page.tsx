import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ShowcaseDetailHeader } from "@/components/showcase-detail-header";
import { createMetadata, resolveLocale } from "@/shared/utils/metadata";

import TmpfUI from "./tmpf";

// Cache Components opt-out — remove after this route is adopted.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export async function generateMetadata(
  props: PageProps<"/[locale]/show/yet-another-tempfiles">
): Promise<Metadata> {
  const { locale: routeLocale } = await props.params;
  const locale = resolveLocale(routeLocale);
  const t = await getTranslations({ locale });

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
