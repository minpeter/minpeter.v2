import type { Route } from "next";
import Image from "next/image";

import Header from "@/components/header";

import { hermes3, llama3p1, qwen2p5 } from "./assets";

export default async function Page(
  props: PageProps<"/[locale]/show/model-card-artwork">
) {
  const { locale } = await props.params;
  return (
    <section className="flex flex-col gap-3">
      <Header
        link={{ href: `/${locale}/show` as Route, text: "Back" }}
        title="/show/model-card-artwork"
      />
      <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-2 md:grid-cols-3">
        <Image alt="llama3.1" placeholder="blur" src={llama3p1} />
        <Image alt="hermes3" placeholder="blur" src={hermes3} />
        <Image alt="qwen2.5" placeholder="blur" src={qwen2p5} />
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
