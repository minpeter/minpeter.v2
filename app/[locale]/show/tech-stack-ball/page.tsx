import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import { ShowcaseDetailHeader } from "@/components/showcase-detail-header";
import { createMetadata } from "@/shared/utils/metadata";

import { PlaygroundWrapper } from "./playground-wrapper";

// Deliberate Block: client-only interaction (canvas / Date.now / Math.random / network).
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  const [locale, t] = await Promise.all([getLocale(), getTranslations()]);

  return createMetadata({
    description: t("showcase.items.techStack.summary"),
    locale,
    path: "/show/tech-stack-ball",
    title: "minpeter | tech stack ball",
  });
}

export default async function Page(
  _props: PageProps<"/[locale]/show/tech-stack-ball">
) {
  const t = await getTranslations();

  return (
    <section className="showcase-page">
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

      <PlaygroundWrapper
        className="rounded-none border-0 bg-transparent shadow-none"
        h={400}
        w={800}
      />
    </section>
  );
}
