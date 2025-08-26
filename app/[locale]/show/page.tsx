import Header from "@/components/header";
import { getI18n } from "@/locales/server";
import Link from "next/link";
import type { Route } from "next";

import { setStaticParamsLocale } from "next-international/server";

import NewMetadata from "@/lib/metadata";
import { createFeatureGate } from "@/lib/flags";

export const metadata = NewMetadata({
  title: "minpeter | showcase",
  description: "공들여 만들었지만 사용하지 않는 컴포넌트의 무덤",
});

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
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
        <Link
          href={`/${locale}/show/yet-another-tempfiles` as Route}
          className="underline"
        >
          /show/yet-another-tempfiles
        </Link>

        <Link
          href={`/${locale}/show/tech-stack-ball` as Route}
          className="underline"
        >
          /show/tech-stack-ball
        </Link>

        <Link
          href={`/${locale}/show/dynamic-hacked-text` as Route}
          className="underline"
        >
          /show/dynamic-hacked-text
        </Link>

        <Link
          href={`/${locale}/show/new-year-clock` as Route}
          className="underline"
        >
          /show/new-year-clock
        </Link>

        <Link
          href={`/${locale}/show/model-card-artwork` as Route}
          className="underline"
        >
          /show/model-card-artwork
        </Link>

        <Link
          href={`/${locale}/show/unstructured` as Route}
          className="underline"
        >
          /show/unstructured
        </Link>

        <div>test_flag is {enabled ? "on" : "off"}</div>
      </div>
    </section>
  );
}
