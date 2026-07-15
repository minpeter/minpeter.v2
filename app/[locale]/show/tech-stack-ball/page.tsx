import type { Route } from "next";
import { getTranslations } from "next-intl/server";

import { ShowcaseDetailHeader } from "@/components/showcase-detail-header";
import NewMetadata from "@/shared/utils/metadata";

import { PlaygroundWrapper } from "./playground-wrapper";

export const metadata = NewMetadata({
  description: "A spinning inventory of the tools behind this site.",
  title: "minpeter | tech stack ball",
});

export default async function Page(
  props: PageProps<"/[locale]/show/tech-stack-ball">
) {
  const [{ locale }, t] = await Promise.all([props.params, getTranslations()]);

  return (
    <section className="showcase-page">
      <ShowcaseDetailHeader
        backLabel={t("back")}
        description="A draggable, floating inventory of tools used to build this site."
        href={`/${locale}/show` as Route}
        kicker="Physics study"
        title="Tech stack ball"
      />

      <PlaygroundWrapper
        className="rounded-none border-0 bg-transparent shadow-none"
        h={400}
        w={800}
      />
    </section>
  );
}
