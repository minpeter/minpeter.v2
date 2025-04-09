import Header from "@/components/header";
import { getI18n } from "@/locales/server";
import Link from "next/link";

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
        link={{ href: "/", text: t("backToHome") }}
      />
      <div
        data-animate
        data-animate-speed="fast"
        className="flex flex-col gap-2"
      >
        <div>myFeatureGate is {enabled ? "on" : "off"}</div>
        <Link href="/show/yet-another-tempfiles" className="underline">
          /show/yet-another-tempfiles
        </Link>

        <Link href="/show/tech-stack-ball" className="underline">
          /show/tech-stack-ball
        </Link>

        <Link href="/show/dynamic-hacked-text" className="underline">
          /show/dynamic-hacked-text
        </Link>

        <Link href="/show/new-year-clock" className="underline">
          /show/new-year-clock
        </Link>

        <Link href="/show/model-card-artwork" className="underline">
          /show/model-card-artwork
        </Link>

        <Link href="/show/unstructured" className="underline">
          /show/unstructured
        </Link>
      </div>
    </section>
  );
}
