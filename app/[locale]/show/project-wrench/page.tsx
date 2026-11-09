import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import { ShowcaseProjectCollection } from "@/components/showcase-project-collection";
import { createMetadata, createSectionImage } from "@/shared/utils/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const [locale, t] = await Promise.all([
    getLocale(),
    getTranslations("showcase.items.wrench"),
  ]);
  const title = `minpeter | ${t("title")}`;

  return createMetadata({
    description: t("summary"),
    image: createSectionImage(locale, "/show/project-wrench", title),
    locale,
    path: "/show/project-wrench",
    title,
  });
}

export default async function Page() {
  const t = await getTranslations("showcase.items.wrench");

  return (
    <ShowcaseProjectCollection
      description={t("description")}
      kicker={t("kicker")}
      projects={[
        {
          description: t("training.description"),
          href: "https://github.com/minpeter/Wrench",
          label: t("training.label"),
          name: "Wrench",
        },
        {
          description: t("parser.description"),
          href: "https://github.com/minpeter/hermes-llama-parse",
          label: t("parser.label"),
          name: "hermes-llama-parse",
        },
        {
          description: t("middleware.description"),
          href: "https://github.com/minpeter/ai-sdk-tool-call-middleware",
          label: t("middleware.label"),
          name: "ai-sdk-tool-call-middleware",
        },
        {
          description: t("plugsuits.description"),
          href: "https://github.com/minpeter/plugsuits",
          label: t("plugsuits.label"),
          name: "plugsuits",
        },
        {
          description: t("runtime.description"),
          href: "https://github.com/minpeter/pss-runtime",
          label: t("runtime.label"),
          name: "pss-runtime",
        },
      ]}
      title={t("title")}
    />
  );
}
