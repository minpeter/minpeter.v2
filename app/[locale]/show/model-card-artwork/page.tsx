import type { Metadata, Route } from "next";
import { getTranslations } from "next-intl/server";
import Image from "next/image";

import Header from "@/components/header";
import NewMetadata from "@/shared/utils/metadata";

import { modelCardArtworks } from "./assets";

export async function generateMetadata(
  props: PageProps<"/[locale]/show/model-card-artwork">
): Promise<Metadata> {
  const { locale } = await props.params;

  return NewMetadata({
    description: "Artwork studies for language model cards.",
    locale,
    path: "/show/model-card-artwork",
    title: "minpeter | model card artwork",
  });
}

export default async function Page(
  props: PageProps<"/[locale]/show/model-card-artwork">
) {
  const [{ locale }, t] = await Promise.all([props.params, getTranslations()]);
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
