import type { Metadata, Route } from "next";
import { getTranslations } from "next-intl/server";

import { ShowcaseDetailHeader } from "@/components/showcase-detail-header";
import { createMetadata, resolveLocale } from "@/shared/utils/metadata";

import AnimatedText from "./animated-text";

export async function generateMetadata(
  props: PageProps<"/[locale]/show/dynamic-hacked-text">
): Promise<Metadata> {
  const { locale: routeLocale } = await props.params;
  const locale = resolveLocale(routeLocale);

  return createMetadata({
    description: "Hover over the letters and watch them react.",
    locale,
    path: "/show/dynamic-hacked-text",
    title: "minpeter | dynamic hacked text",
  });
}

export default async function Page(
  props: PageProps<"/[locale]/show/dynamic-hacked-text">
) {
  const [{ locale }, t] = await Promise.all([props.params, getTranslations()]);

  return (
    <section className="showcase-page">
      <ShowcaseDetailHeader
        backLabel={t("back")}
        description="Move across the letters and watch the text reconstruct itself."
        href={`/${locale}/show` as Route}
        kicker="Interaction study"
        title="Dynamic hacked text"
      />

      <div className="flex min-h-56 items-center justify-center rounded-lg border border-foreground/10 bg-secondary/35 px-5">
        <AnimatedText data={"Hello world"} />
      </div>
    </section>
  );
}
