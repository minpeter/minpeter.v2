import type { Route } from "next";
import Link from "next/link";
import { setStaticParamsLocale } from "next-international/server";

import Header from "@/components/header";
import { createFeatureGate } from "@/lib/flags";
import NewMetadata from "@/lib/utils/metadata";
import { getI18n } from "@/locales/server";

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

export default async function Page({
  params,
}: {
  params: Promise<{ locale: "ko" | "en" }>;
}) {
  const { locale } = await params;

  setStaticParamsLocale(locale);

  const enabled = await createFeatureGate("test_flag")(); //Disabled by default, edit in the Statsig console

  const t = await getI18n();
  return (
    <section className="flex flex-col gap-3">
      <Header
        title="showcase"
        description="Just things I did"
        link={{ href: `/${locale}` as Route, text: t("backToHome") }}
      />
      <div
        data-animate
        data-animate-speed="fast"
        className="flex flex-col gap-2"
      >
        {showcasePaths.map((path) => (
          <Link
            key={path}
            href={`/${locale}${path}` as Route}
            className="underline"
          >
            {path}
          </Link>
        ))}

        <div>test_flag is {enabled ? "on" : "off"}</div>
      </div>
    </section>
  );
}
