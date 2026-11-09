import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import { ProductFirstFramePreload } from "@/components/product-first-frame-preload";
import { ProductSpin } from "@/components/product-spin";
import { Link } from "@/shared/i18n/navigation";
import { PRODUCTS } from "@/shared/products";
import { createMetadata, createSectionImage } from "@/shared/utils/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const [locale, t] = await Promise.all([getLocale(), getTranslations()]);
  const title = `minpeter | ${t("products.title")}`;

  return createMetadata({
    description: t("products.description"),
    image: createSectionImage(locale, "/products", title),
    locale,
    path: "/products",
    title,
  });
}

export default async function Page(_props: PageProps<"/[locale]/products">) {
  const t = await getTranslations();
  // Only the first visible catalog turntable: never preload every angle or product.
  // Detail URLs may select another configuration, so do not guess their frame here.
  const firstSpin = PRODUCTS[0]?.spin;
  const firstFrame = firstSpin?.frameSources?.[firstSpin.defaultFrame];

  return (
    <section
      aria-label={t("products.title")}
      className="store-grid"
      data-testid="products-page"
    >
      {firstFrame ? <ProductFirstFramePreload source={firstFrame} /> : null}
      {PRODUCTS.map((product) => (
        <Link
          aria-label={product.name}
          className="store-card"
          data-testid={`product-link-${product.slug}`}
          href={`/products/${product.slug}`}
          key={product.slug}
        >
          {/* Hovering scrubs the turntable; the link itself carries the name. */}
          <ProductSpin
            sizes="(min-width: 64rem) 25vw, 50vw"
            spin={product.spin}
          />
          <span aria-hidden="true" className="store-card-caption store-label">
            <span>{product.name}</span>
            <span>{t(`products.items.${product.key}.license`)}</span>
          </span>
        </Link>
      ))}
    </section>
  );
}
