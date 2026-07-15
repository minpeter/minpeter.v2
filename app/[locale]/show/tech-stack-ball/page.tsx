import type { Metadata, Route } from "next";
import { getTranslations } from "next-intl/server";

import { ShowcaseDetailHeader } from "@/components/showcase-detail-header";
import { createMetadata, resolveLocale } from "@/shared/utils/metadata";

import { PlaygroundWrapper } from "./playground-wrapper";

export async function generateMetadata(
  props: PageProps<"/[locale]/show/tech-stack-ball">
): Promise<Metadata> {
  const { locale: routeLocale } = await props.params;
  const locale = resolveLocale(routeLocale);
  const t = await getTranslations({ locale });

  return createMetadata({
    description: t("showcase.items.techStack.summary"),
    locale,
    path: "/show/tech-stack-ball",
    title: "minpeter | tech stack ball",
  });
}

export default async function Page(
  props: PageProps<"/[locale]/show/tech-stack-ball">
) {
  const [{ locale }, t] = await Promise.all([props.params, getTranslations()]);

  return (
    <section className="showcase-page">
      <ShowcaseDetailHeader
        backLabel={t("back")}
        description={t("showcase.items.techStack.description")}
        href={`/${locale}/show` as Route}
        kicker={t("showcase.items.techStack.kicker")}
        navigationLabel={t("showcase.detailNavigationLabel", {
          title: t("showcase.items.techStack.title"),
        })}
        title={t("showcase.items.techStack.title")}
      />

      <PlaygroundWrapper
        className="rounded-none border-0 bg-transparent shadow-none"
        h={400}
        w={800}
      />
    </section>
  );
}
