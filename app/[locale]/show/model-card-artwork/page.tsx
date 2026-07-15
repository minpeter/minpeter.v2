import type { Metadata, Route } from "next";
import { getTranslations } from "next-intl/server";
import Image from "next/image";

import { ShowcaseDetailHeader } from "@/components/showcase-detail-header";
import { createMetadata, resolveLocale } from "@/shared/utils/metadata";

import { modelCardArtworks } from "./assets";

export async function generateMetadata(
  props: PageProps<"/[locale]/show/model-card-artwork">
): Promise<Metadata> {
  const { locale: routeLocale } = await props.params;
  const locale = resolveLocale(routeLocale);

  return createMetadata({
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
    <section className="showcase-page">
      <ShowcaseDetailHeader
        backLabel={t("back")}
        description="Visual studies made for language model launch cards."
        href={`/${locale}/show` as Route}
        kicker="Artwork study"
        title="Model card artwork"
      />

      <div className="grid grid-cols-3 items-start gap-3">
        {modelCardArtworks.map((artwork) => (
          <div className="overflow-hidden bg-secondary" key={artwork.alt}>
            <Image
              alt={artwork.alt}
              className="h-auto w-full"
              placeholder="blur"
              sizes="(min-width: 512px) 162px, calc((100vw - 64px) / 3)"
              src={artwork.src}
            />
          </div>
        ))}
      </div>

      <aside className="mt-12 border-foreground/15 border-t pt-5">
        <p className="showcase-kicker">Image credits</p>
        <div className="space-y-1 text-[0.6875rem] text-muted-foreground leading-relaxed">
          <p>Original image © 2024 NousResearch Corp. All rights reserved.</p>
          <p>Original image © 2025 イシガミ アキラ. All rights reserved.</p>
        </div>
      </aside>
    </section>
  );
}
