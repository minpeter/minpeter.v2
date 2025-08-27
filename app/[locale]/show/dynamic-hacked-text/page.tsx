import Header from "@/components/header";
import AnimatedText from "./animated-text";
import type { Route } from "next";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: "ko" | "en" }>;
}) {
  const { locale } = await params;
  return (
    <section className="flex flex-col gap-3">
      <Header
        title="/show/dynamic-hacked-text"
        description="글자 위에 마우스를 가져다 놓아보세요"
        link={{ href: `/${locale}/show` as Route, text: "showcase로 돌아가기" }}
      />
      <div data-animate data-animate-speed="slow">
        <AnimatedText data={"Hello world"} />
      </div>
    </section>
  );
}
