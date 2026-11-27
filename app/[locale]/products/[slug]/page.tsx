import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { type ReactNode, Suspense } from "react";
import { Maru60ScrollCinema } from "@/components/maru60-scroll-cinema";
import { ProductCustomizer } from "@/components/product-customizer";
import { ProductCustomizerSkeleton } from "@/components/product-customizer-skeleton";
import { SkateboardStandCustomizer } from "@/components/skateboard-stand-customizer";
import { SkateboardStandCustomizerSkeleton } from "@/components/skateboard-stand-customizer-skeleton";
import { SkateboardStandScrollCinema } from "@/components/skateboard-stand-scroll-cinema";
import { SkateboardStandShowcase } from "@/components/skateboard-stand-showcase";
import { getProduct, PRODUCTS, type Product } from "@/shared/products";
import {
  createMetadata,
  createNotFoundMetadata,
} from "@/shared/utils/metadata";

import Loading from "./loading";

// Unlisted params must finish rendering before the response starts, so
// `notFound()` yields a real HTTP 404 instead of a streamed soft 404.
export const ensureStatic = "navigation";

export function generateStaticParams() {
  return PRODUCTS.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata(
  props: PageProps<"/[locale]/products/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params;
  const product = getProduct(slug);
  const [locale, t, tRoot] = await Promise.all([
    getLocale(),
    getTranslations("products"),
    getTranslations(),
  ]);

  if (!product) {
    return createNotFoundMetadata({
      description: tRoot("notFound.description"),
      locale,
    });
  }

  return createMetadata({
    description: t(`items.${product.key}.description`),
    image: product.preview && {
      alt: product.name,
      url: product.preview.image,
    },
    locale,
    path: `/products/${product.slug}`,
    title: `minpeter | ${product.name}`,
    video: product.preview?.video,
  });
}

function renderStoreChannelCta(
  storeChannel: Product["storeChannel"],
  labels: { buy: string; notify: string; soon: string }
): ReactNode {
  if (!storeChannel) {
    return null;
  }
  if (storeChannel.href) {
    return (
      <a
        className="store-button store-label"
        data-primary
        data-store-cta
        data-testid="product-store-cta"
        href={storeChannel.href}
        rel="noreferrer"
        target="_blank"
      >
        {storeChannel.intent === "notify" ? labels.notify : labels.buy}
      </a>
    );
  }
  return (
    <button
      className="store-button store-label"
      data-disabled="true"
      data-store-cta
      data-testid="product-store-cta"
      disabled
      type="button"
    >
      {labels.soon}
    </button>
  );
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

  const [locale, t] = await Promise.all([
    getLocale(),
    getTranslations("products"),
  ]);

  const storeChannelCta = renderStoreChannelCta(product.storeChannel, {
    buy: t("naverSmartStore"),
    notify: t("naverSmartStoreNotify"),
    soon: t("naverSmartStoreSoon"),
  });

  const labels = {
    media: t("mediaLabel", { product: product.name }),
    spin: t("spinLabel", { product: product.name }),
  };

  if (product.customizer === "skateboard-stand") {
    const standIntro = (
      <header className="store-product-heading store-stand-heading">
        <div className="flex items-baseline justify-between gap-4">
          <h1>{product.name.toUpperCase()}</h1>
          <span className="store-label shrink-0">
            {t("items.skateboardStand.license")}
          </span>
        </div>
        <p className="store-label text-muted-foreground">
          {t("items.skateboardStand.variant")}
        </p>
      </header>
    );
    const standActions = storeChannelCta ? (
      <div className="store-actions store-actions-single">
        {storeChannelCta}
      </div>
    ) : null;
    const standSpecs = (
      <ul className="store-prose store-details">
        {product.details.map((detail) => (
          <li key={detail}>{t(`items.skateboardStand.details.${detail}`)}</li>
        ))}
      </ul>
    );

    return (
      <article className="store-product" data-testid="product-detail">
        {/* Keep localized content and below-fold sections in the static shell; only URL-dependent controls suspend. */}
        <Suspense
          fallback={
            <SkateboardStandCustomizerSkeleton
              actions={standActions}
              intro={standIntro}
            />
          }
        >
          <SkateboardStandCustomizer
            actions={standActions}
            details={standSpecs}
            intro={standIntro}
            labels={labels}
          />
        </Suspense>
        <SkateboardStandScrollCinema />
        <SkateboardStandShowcase />
      </article>
    );
  }

  const intro = (
    <header className="store-product-heading store-stand-heading">
      <div className="flex items-baseline justify-between gap-4">
        <h1>{product.name.toUpperCase()}</h1>
        <span className="store-label shrink-0">
          {t(`items.${product.key}.license`)}
        </span>
      </div>
      <p className="store-label text-muted-foreground">
        {t(`items.${product.key}.variant`)}
      </p>
      {product.upcomingPrice ? (
        <p
          className="store-label mt-1.5 flex flex-wrap items-baseline gap-x-3"
          data-testid="product-price"
        >
          <span className="text-foreground">
            {new Intl.NumberFormat(locale, {
              currency: "KRW",
              currencyDisplay: "code",
              style: "currency",
            }).formatRange(
              product.upcomingPrice.min,
              product.upcomingPrice.max
            )}
          </span>
          <span className="text-muted-foreground">{t("upcoming")}</span>
        </p>
      ) : null}
    </header>
  );

  const actions =
    storeChannelCta || product.sourceHref || product.downloadHref ? (
      <div
        className={
          product.storeChannel && !(product.sourceHref || product.downloadHref)
            ? "store-actions store-actions-single"
            : "store-actions"
        }
      >
        {storeChannelCta}
        {product.sourceHref ? (
          <a
            className="store-button store-label"
            href={product.sourceHref}
            rel="noreferrer"
            target="_blank"
          >
            {t("viewSource")}
          </a>
        ) : null}
        {product.downloadHref ? (
          <a
            className="store-button store-label"
            data-store-cta={storeChannelCta ? undefined : ""}
            href={product.downloadHref}
            rel="noreferrer"
            target="_blank"
          >
            {t("downloadFiles")}
          </a>
        ) : null}
      </div>
    ) : null;

  const specs = (
    <ul className="store-prose store-details">
      {product.details.map((detail) => (
        <li key={detail}>{t(`items.rule60.details.${detail}`)}</li>
      ))}
    </ul>
  );

  return (
    <article className="store-product" data-testid="product-detail">
      {/* Keep localized content in the static shell; only URL-dependent controls suspend. */}
      <Suspense
        fallback={<ProductCustomizerSkeleton actions={actions} intro={intro} />}
      >
        <ProductCustomizer
          actions={actions}
          details={specs}
          intro={intro}
          labels={labels}
          spin={product.spin}
        />
      </Suspense>
      {product.slug === "maru60" ? <Maru60ScrollCinema /> : null}
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
