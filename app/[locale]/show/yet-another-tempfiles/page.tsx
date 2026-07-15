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

  return createMetadata({
    description: "A simpler frontend for temporary files.",
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
        description="A small, direct interface for uploading temporary files."
        href={`/${locale}/show` as Route}
        kicker="Utility study"
        title="Yet another tempfiles"
      />

      <div className="rounded-lg border border-foreground/10 bg-secondary/25 p-5 sm:p-6">
        <TmpfUI />
      </div>
      <p className="mt-3 text-[0.6875rem] text-muted-foreground leading-relaxed">
        Files are uploaded to tmpf.me and may be publicly accessible by URL.
      </p>
    </section>
  );
}
