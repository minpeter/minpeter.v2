import { getTranslations } from "next-intl/server";
import { ProductCustomizerSkeleton } from "@/components/product-customizer-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

const DESCRIPTION_LINES = ["first", "second", "third", "fourth", "fifth"];
const DETAIL_LINES = [
  "first",
  "second",
  "third",
  "fourth",
  "fifth",
  "sixth",
  "seventh",
  "eighth",
  "ninth",
  "tenth",
];

/** Mirrors the customizer's geometry, not the retired gallery-only layout. */
export function ProductDetailSkeleton({ introText }: { introText: string }) {
  const intro = (
    <div aria-hidden="true" className="store-product-heading">
      <h1>MARU60</h1>
      <p className="store-product-intro">{introText}</p>
    </div>
  );
  const details = (
    <div aria-hidden="true" className="store-product-info">
      <div className="store-label">
        <div className="flex items-baseline justify-between gap-4">
          <Skeleton className="store-skeleton-label w-20 rounded-none" />
          <Skeleton className="store-skeleton-label w-24 rounded-none" />
        </div>
        <Skeleton className="store-skeleton-label mt-0 w-4/5 rounded-none" />
        <Skeleton className="store-skeleton-label mt-3 w-3/4 rounded-none" />
      </div>
      <div className="store-actions">
        <Skeleton className="store-button rounded-none" />
        <Skeleton className="store-button rounded-none" />
      </div>
      <section>
        <div className="store-label mb-3">
          <Skeleton className="store-skeleton-label w-24 rounded-none" />
        </div>
        <div className="store-prose store-skeleton-copy">
          {DESCRIPTION_LINES.map((line) => (
            <Skeleton className="rounded-none" key={line} />
          ))}
        </div>
      </section>
      <section>
        <div className="store-label mb-3">
          <Skeleton className="store-skeleton-label w-16 rounded-none" />
        </div>
        <div className="store-prose store-skeleton-copy">
          {DETAIL_LINES.map((line) => (
            <Skeleton className="rounded-none" key={line} />
          ))}
        </div>
      </section>
    </div>
  );
  return (
    <div
      aria-busy="true"
      className="store-product"
      data-testid="product-detail-skeleton"
    >
      <ProductCustomizerSkeleton details={details} intro={intro} />
    </div>
  );
}

export default async function Loading() {
  const t = await getTranslations("products");
  return <ProductDetailSkeleton introText={t("items.rule60.intro")} />;
}
