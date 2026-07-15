import type { Metadata, Route } from "next";

import Header from "@/components/header";
import { createMetadata, resolveLocale } from "@/shared/utils/metadata";
import { cn } from "@/shared/utils/tailwind";

import TmpfUI from "./tmpf";

import styles from "@/shared/styles/stagger-fade-in.module.css";

export async function generateMetadata(
  props: PageProps<"/[locale]/show/yet-another-tempfiles">
): Promise<Metadata> {
  const { locale: routeLocale } = await props.params;
  const locale = resolveLocale(routeLocale);

  return createMetadata({
    description: "A simpler frontend for temporary files.",
    locale,
    path: "/show/yet-another-tempfiles",
    title: "minpeter | yet another tempfiles",
  });
}

export default async function Page(
  props: PageProps<"/[locale]/show/yet-another-tempfiles">
) {
  const { locale } = await props.params;
  return (
    <section className="flex flex-col gap-3">
      <Header
        description="tmpf.me보다 간단한 대체 프론트엔드"
        link={{ href: `/${locale}/show` as Route, text: "showcase로 돌아가기" }}
        title="/show/yet-another-tempfiles"
      />
      <div
        className={cn(styles.stagger_container, styles.slow, "flex flex-col")}
      >
        <TmpfUI />
      </div>
    </section>
  );
}
