import type { Route } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import Header from "@/components/header";
import { createFeatureGate } from "@/shared/flags";
import styles from "@/shared/styles/stagger-fade-in.module.css";
import NewMetadata from "@/shared/utils/metadata";
import { cn } from "@/shared/utils/tailwind";

export const metadata = NewMetadata({
  title: "minpeter | showcase",
  description: "공들여 만들었지만 사용하지 않는 컴포넌트의 무덤",
});

const showcasePaths = [
  "/show/yet-another-tempfiles",
  "/show/tech-stack-ball",
  "/show/dynamic-hacked-text",
  "/show/new-year-clock",
  "/show/model-card-artwork",
  "/show/unstructured",
] as const;

export default async function Page(props: PageProps<"/[locale]/show">) {
  const { locale } = await props.params;

  const enabled = await createFeatureGate("test_flag")(); //Disabled by default, edit in the Statsig console

  const t = await getTranslations();
  return (
    <section className="flex flex-col gap-3">
      <Header
        description="Just things I did"
        link={{ href: `/${locale}` as Route, text: t("backToHome") }}
        title="showcase"
      />
      <div
        className={cn(
          styles.stagger_container,
          styles.fast,
          "flex flex-col gap-2"
        )}
      >
        {showcasePaths.map((path) => (
          <Link
            className="underline"
            href={`/${locale}${path}` as Route}
            key={path}
          >
            {path}
          </Link>
        ))}

        <div>test_flag is {enabled ? "on" : "off"}</div>
      </div>
    </section>
  );
}
