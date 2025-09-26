import { Backlink } from "@/components/link";
import type { Route } from "next";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: "ko" | "en" }>;
}) {
  const { locale } = await params;
  return (
    <section className="flex flex-col gap-1">
      <div data-animate data-animate-speed="fast">
        <Backlink text="돌아가기" href={`/${locale}` as Route} />
      </div>
      <div data-animate data-animate-speed="slow" className="flex flex-col">
        <p>동짓달 기나긴 밤을 한 허리를 베어내어</p>
        <p>봄바람 이불 아래 서리서리 넣었다가</p>
        <p>사랑하는 님 오신 밤이거든 굽이굽이 펴리라</p>
      </div>
    </section>
  );
}
