import type { Route } from "next";

import Header from "@/components/header";
import styles from "@/lib/styles/stagger-fade-in.module.css";
import { cn } from "@/lib/utils/tailwind";

import { Playground } from "./animated-stack";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: "ko" | "en" }>;
}) {
  const { locale } = await params;
  return (
    <section className="flex flex-col gap-3">
      <Header
        title="/show/tech-stack-ball"
        description="예전엔 이게 인덱스 페이지에 있었는데, 이제는 여기에 있어요"
        link={{ href: `/${locale}/show` as Route, text: "showcase로 돌아가기" }}
      />
      <div
        className={cn(styles.stagger_container, styles.slow, "flex flex-col")}
      >
        <Playground w={800} h={400} />
      </div>
    </section>
  );
}
