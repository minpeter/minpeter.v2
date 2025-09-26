import Header from "@/components/header";

import { hermes3, llama3p1, qwen2p5 } from "./assets";
import Image from "next/image";
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
        title="/show/model-card-artwork"
        link={{ href: `/${locale}/show` as Route, text: "Back" }}
      />
      <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-2 md:grid-cols-3">
        <Image placeholder="blur" src={llama3p1} alt="llama3.1" />
        <Image placeholder="blur" src={hermes3} alt="hermes3" />
        <Image placeholder="blur" src={qwen2p5} alt="qwen2.5" />
      </div>

      <hr />

      <p className="text-xs">
        About the original image ⓒ 2024. NousResearch Corp. All rights reserved.
      </p>
      <p className="text-xs">
        About the original image ⓒ 2025. イシガミ　アキラ All rights reserved.
      </p>
    </section>
  );
}
