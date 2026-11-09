import type { Metadata } from "next";
import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";

import { ShowcaseDetailHeader } from "@/components/showcase-detail-header";
import { createMetadata, createSectionImage } from "@/shared/utils/metadata";

import { modelCardArtworks } from "./assets";

export async function generateMetadata(): Promise<Metadata> {
  const [locale, t] = await Promise.all([getLocale(), getTranslations()]);
  const title = `minpeter | ${t("showcase.items.modelCard.title")}`;

  return createMetadata({
    description: t("showcase.items.modelCard.summary"),
    image: createSectionImage(locale, "/show/model-card-artwork", title),
    locale,
    path: "/show/model-card-artwork",
    title,
  });
}

export default async function Page(
  _props: PageProps<"/[locale]/show/model-card-artwork">
) {
  const t = await getTranslations();
  return (
    <section className="showcase-page">
      <ShowcaseDetailHeader
        backLabel={t("back")}
        description={t("showcase.items.modelCard.description")}
        href="/show"
        kicker={t("showcase.items.modelCard.kicker")}
        navigationLabel={t("showcase.detailNavigationLabel", {
          title: t("showcase.items.modelCard.title"),
        })}
        title={t("showcase.items.modelCard.title")}
      />

      <div className="grid grid-cols-3 items-start gap-3">
        {modelCardArtworks.map((artwork, index) => (
          <div className="bg-secondary overflow-hidden" key={artwork.alt}>
            <Image
              alt={artwork.alt}
              className="h-auto w-full"
              placeholder="blur"
              priority={index === 0}
              sizes="(min-width: 512px) 162px, calc((100vw - 64px) / 3)"
              src={artwork.src}
            />
          </div>
        ))}
      </div>

      <aside className="border-foreground/15 mt-12 border-t pt-5">
        <p className="showcase-kicker">
          {t("showcase.items.modelCard.credits")}
        </p>
        <div className="text-muted-foreground space-y-1 text-[0.6875rem] leading-relaxed">
          <p>{t("showcase.items.modelCard.creditNous")}</p>
          <p>{t("showcase.items.modelCard.creditIshigami")}</p>
        </div>
      </aside>
    </section>
  );
}
