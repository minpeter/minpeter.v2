import type { Route } from "next";

import { Backlink } from "@/components/link";
import styles from "@/lib/styles/stagger-fade-in.module.css";
import { cn } from "@/lib/utils/tailwind";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: "ko" | "en" }>;
}) {
  const { locale } = await params;
  return (
    <section className="flex flex-col gap-1">
      <div className={cn(styles.stagger_container, styles.fast)}>
        <Backlink text="돌아가기" href={`/${locale}` as Route} />
      </div>
      <div
        className={cn(styles.stagger_container, styles.slow, "flex flex-col")}
      >
        <p>동짓달 기나긴 밤을 한 허리를 베어내어</p>
        <p>봄바람 이불 아래 서리서리 넣었다가</p>
        <p>사랑하는 님 오신 밤이거든 굽이굽이 펴리라</p>
      </div>
    </section>
  );
}
