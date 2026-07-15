import type { Metadata, Route } from "next";
import { getTranslations } from "next-intl/server";

import { ShowcaseDetailHeader } from "@/components/showcase-detail-header";
import { createMetadata, resolveLocale } from "@/shared/utils/metadata";

import TmpfUI from "./tmpf";

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
  props: PageProps<"/[locale]/show/yet-another-tempfiles">
) {
  const [{ locale }, t] = await Promise.all([props.params, getTranslations()]);

  return (
    <section className="showcase-page">
      <ShowcaseDetailHeader
        backLabel={t("back")}
        description={t("showcase.items.tempfiles.description")}
        href={`/${locale}/show` as Route}
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
