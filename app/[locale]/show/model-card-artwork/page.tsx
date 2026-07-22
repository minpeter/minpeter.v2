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
  const t = await getTranslations({ locale });

  return createMetadata({
    description: t("showcase.items.modelCard.summary"),
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
        description={t("showcase.items.modelCard.description")}
        href={`/${locale}/show` as Route}
        kicker={t("showcase.items.modelCard.kicker")}
        navigationLabel={t("showcase.detailNavigationLabel", {
          title: t("showcase.items.modelCard.title"),
        })}
        title={t("showcase.items.modelCard.title")}
      />

      <div className="grid grid-cols-3 items-start gap-3">
        {modelCardArtworks.map((artwork, index) => (
          <div className="overflow-hidden bg-secondary" key={artwork.alt}>
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

      <aside className="mt-12 border-foreground/15 border-t pt-5">
        <p className="showcase-kicker">
          {t("showcase.items.modelCard.credits")}
        </p>
        <div className="space-y-1 text-[0.6875rem] text-muted-foreground leading-relaxed">
          <p>{t("showcase.items.modelCard.creditNous")}</p>
          <p>{t("showcase.items.modelCard.creditIshigami")}</p>
        </div>
      </aside>
    </section>
  );
}
