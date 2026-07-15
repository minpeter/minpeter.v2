import type { Metadata, Route } from "next";

import Header from "@/components/header";
import { createMetadata, resolveLocale } from "@/shared/utils/metadata";
import { cn } from "@/shared/utils/tailwind";

import AnimatedText from "./animated-text";

import styles from "@/shared/styles/stagger-fade-in.module.css";

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
  const { locale } = await props.params;
  return (
    <section className="flex flex-col gap-3">
      <Header
        description="글자 위에 마우스를 가져다 놓아보세요"
        link={{ href: `/${locale}/show` as Route, text: "showcase로 돌아가기" }}
        title="/show/dynamic-hacked-text"
      />
      <div className={cn(styles.stagger_container, styles.slow)}>
        <AnimatedText data={"Hello world"} />
      </div>
    </section>
  );
}
