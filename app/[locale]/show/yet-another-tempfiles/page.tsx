import type { Route } from "next";

import Header from "@/components/header";

import TmpfUI from "./tmpf";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: "ko" | "en" }>;
}) {
  const { locale } = await params;
  return (
    <section className="flex flex-col gap-3">
      <Header
        title="/show/yet-another-tempfiles"
        description="tmpf.me보다 간단한 대체 프론트엔드"
        link={{ href: `/${locale}/show` as Route, text: "showcase로 돌아가기" }}
      />
      <div data-animate data-animate-speed="slow" className="flex flex-col">
        <TmpfUI />
      </div>
    </section>
  );
}
