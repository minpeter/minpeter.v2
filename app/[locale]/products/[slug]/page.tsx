import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { ProductGallery } from "@/components/product-gallery";
import { getProduct, PRODUCTS } from "@/shared/products";
import { createMetadata } from "@/shared/utils/metadata";

import Loading from "./loading";

export function generateStaticParams() {
  return PRODUCTS.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata(
  props: PageProps<"/[locale]/products/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params;
  const product = getProduct(slug);
  const [locale, t] = await Promise.all([
    getLocale(),
    getTranslations("products"),
  ]);

  if (!product) {
    return createMetadata({ locale, title: "minpeter | products" });
  }

  return createMetadata({
    description: t(`items.${product.key}.description`),
    locale,
    path: `/products/${product.slug}`,
    title: `minpeter | ${product.name}`,
  });
}

async function ProductDetail({
  params,
}: {
  params: PageProps<"/[locale]/products/[slug]">["params"];
}) {
  const { slug } = await params;
  const product = getProduct(slug);

  if (!product) {
    notFound();
  }

  const t = await getTranslations("products");
  const slides = product.renders.length + 1;

  return (
    <article className="store-product" data-testid="product-detail">
      <ProductGallery
        labels={{
          media: t("mediaLabel", { product: product.name }),
          next: t("nextImage"),
          previous: t("previousImage"),
          showImage: Array.from({ length: slides }, (_, index) =>
            t("showImage", { index: String(index + 1) })
          ),
          spin: t("spinLabel", { product: product.name }),
        }}
        renders={product.renders.map((render) => ({
          alt: t(`renderAlts.${render.alt}`),
          image: render.image,
        }))}
        spin={product.spin}
      />

      <div className="store-product-info">
        <div>
          <div className="flex items-baseline justify-between gap-4">
            <h1 className="store-label text-foreground">{product.name}</h1>
            <span className="store-label shrink-0">
              {t(`items.${product.key}.license`)}
            </span>
          </div>
          <p className="store-label text-muted-foreground">
            {t(`items.${product.key}.variant`)}
          </p>
        </div>

        <div className="store-actions">
          <a
            className="store-button store-label"
            href={product.sourceHref}
            rel="noreferrer"
            target="_blank"
          >
            {t("viewSource")}
          </a>
          <a
            className="store-button store-label"
            data-primary
            href={product.downloadHref}
            rel="noreferrer"
            target="_blank"
          >
            {t("downloadFiles")}
          </a>
        </div>

        <section>
          <h2 className="store-label mb-3">{t("descriptionLabel")}</h2>
          <p className="store-prose">{t(`items.${product.key}.description`)}</p>
        </section>

        <section>
          <h2 className="store-label mb-3">{t("detailsLabel")}</h2>
          <ul className="store-prose store-details">
            {product.details.map((detail) => (
              <li key={detail}>
                {t(`items.${product.key}.details.${detail}`)}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </article>
  );
}

export default function Page(props: PageProps<"/[locale]/products/[slug]">) {
  // Unlisted slugs resolve at request time; keep the segment shell instant.
  return (
    <Suspense fallback={<Loading />}>
      <ProductDetail params={props.params} />
    </Suspense>
  );
}
