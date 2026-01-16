import type { Route } from "next";

import Header from "@/components/header";
import styles from "@/shared/styles/stagger-fade-in.module.css";
import { cn } from "@/shared/utils/tailwind";

import { PlaygroundWrapper } from "./playground-wrapper";

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
