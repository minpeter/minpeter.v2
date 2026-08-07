import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import { Backlink } from "@/components/link";
import styles from "@/shared/styles/stagger-fade-in.module.css";
import { createMetadata } from "@/shared/utils/metadata";
import { cn } from "@/shared/utils/tailwind";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();

  return createMetadata({
    description: "동짓달 기나긴 밤을 한 허리를 베어내어",
    locale,
    path: "/73e3da8fa7a397e7b1bc36efabb2cbb265524a75d7d5e6d1620b9e10e694257",
    title: "minpeter | 동짓달 기나긴 밤을",
  });
}

export default async function Page() {
  const t = await getTranslations();
  return (
    <section className="flex flex-col gap-6">
      <div className={cn(styles.stagger_container, styles.fast)}>
        <Backlink href="/" text={t("back")} />
      </div>
      <div
        className={cn(styles.stagger_container, styles.slow, "flex flex-col")}
        lang="ko"
      >
        <p>동짓달 기나긴 밤을 한 허리를 베어내어</p>
        <p>봄바람 이불 아래 서리서리 넣었다가</p>
        <p>사랑하는 님 오신 밤이거든 굽이굽이 펴리라</p>
      </div>
    </section>
  );
}
