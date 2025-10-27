import type { Route } from "next";

import Header from "@/components/header";
import styles from "@/lib/styles/stagger-fade-in.module.css";
import { cn } from "@/lib/utils/tailwind";

import AnimatedText from "./animated-text";

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
