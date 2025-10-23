import type { Route } from "next";

import Header from "@/components/header";
import styles from "@/lib/styles/stagger-fade-in.module.css";
import { cn } from "@/lib/utils/tailwind";

import TmpfUI from "./tmpf";

export default async function Page(
  props: PageProps<"/[locale]/show/yet-another-tempfiles">
) {
  const { locale } = await props.params;
  return (
    <section className="flex flex-col gap-3">
      <Header
        title="/show/yet-another-tempfiles"
        description="tmpf.me보다 간단한 대체 프론트엔드"
        link={{ href: `/${locale}/show` as Route, text: "showcase로 돌아가기" }}
      />
      <div
        className={cn(styles.stagger_container, styles.slow, "flex flex-col")}
      >
        <TmpfUI />
      </div>
    </section>
  );
}
