import type { Route } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";

import Header from "@/components/header";

import { modelCardArtworks } from "./assets";

export default async function Page(
  props: PageProps<"/[locale]/show/model-card-artwork">
) {
  const { locale } = await props.params;
  const t = await getTranslations();
  return (
    <section className="flex flex-col gap-3">
      <Header
        link={{ href: `/${locale}/show` as Route, text: t("back") }}
        title="/show/model-card-artwork"
      />
      <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-2 md:grid-cols-3">
        {modelCardArtworks.map((artwork) => (
          <Image
            alt={artwork.alt}
            key={artwork.alt}
            placeholder="blur"
            src={artwork.src}
          />
        ))}
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
