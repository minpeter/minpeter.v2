import type { Metadata, Route } from "next";

import Header from "@/components/header";
import { createMetadata, resolveLocale } from "@/shared/utils/metadata";
import { cn } from "@/shared/utils/tailwind";

import { PlaygroundWrapper } from "./playground-wrapper";

import styles from "@/shared/styles/stagger-fade-in.module.css";

export async function generateMetadata(
  props: PageProps<"/[locale]/show/tech-stack-ball">
): Promise<Metadata> {
  const { locale: routeLocale } = await props.params;
  const locale = resolveLocale(routeLocale);

  return createMetadata({
    description: "A spinning inventory of the tools behind this site.",
    locale,
    path: "/show/tech-stack-ball",
    title: "minpeter | tech stack ball",
  });
}

export default async function Page(
  props: PageProps<"/[locale]/show/tech-stack-ball">
) {
  const { locale } = await props.params;
  return (
    <section className="flex flex-col gap-3">
      <Header
        description="예전엔 이게 인덱스 페이지에 있었는데, 이제는 여기에 있어요"
        link={{ href: `/${locale}/show` as Route, text: "showcase로 돌아가기" }}
        title="/show/tech-stack-ball"
      />
      <div
        className={cn(styles.stagger_container, styles.slow, "flex flex-col")}
      >
        <PlaygroundWrapper h={400} w={800} />
      </div>
    </section>
  );
}
