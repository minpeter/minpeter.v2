import { ProductCustomizerSkeleton } from "@/components/product-customizer-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

/** Mirrors the minimal customizer's geometry for MARU60 regression checks. */
export function ProductDetailSkeleton({
  actionTexts,
  variantText,
}: {
  actionTexts?: readonly [string, string];
  variantText: string;
}) {
  const intro = (
    <div
      aria-hidden="true"
      className="store-product-heading store-stand-heading"
    >
      <div className="flex items-baseline justify-between gap-4">
        <h1>
          <Skeleton className="store-skeleton-label w-40 rounded-none" />
        </h1>
        <Skeleton className="store-skeleton-label w-24 shrink-0 rounded-none" />
      </div>
      <p className="store-label text-muted-foreground">{variantText}</p>
      <div className="store-label mt-1.5">
        <Skeleton className="store-skeleton-label w-48 rounded-none" />
      </div>
    </div>
  );
  const actions = (
    <div aria-hidden="true" className="store-actions">
      <Skeleton className="store-button store-label rounded-none">
        {actionTexts ? (
          <span className="invisible">{actionTexts[0]}</span>
        ) : null}
      </Skeleton>
      <Skeleton
        className="store-button store-label rounded-none"
        data-store-cta
      >
        {actionTexts ? (
          <span className="invisible">{actionTexts[1]}</span>
        ) : null}
      </Skeleton>
    </div>
  );
  return (
    <div
      aria-busy="true"
      className="store-product"
      data-testid="product-detail-skeleton"
    >
      <ProductCustomizerSkeleton actions={actions} intro={intro} />
      <div aria-hidden="true" className="store-maru-cinema-runway" />
    </div>
  );
}

/** Product-neutral route fallback shared across `/products/[slug]` routes. */
export default function Loading() {
  return (
    <div
      aria-busy="true"
      className="store-product"
      data-testid="product-detail-skeleton"
    >
      <div className="store-customizer store-customizer-minimal">
        <div aria-hidden="true" className="store-custom-visual">
          <div className="store-media-stage">
            <Skeleton className="store-media-skeleton rounded-none" />
          </div>
        </div>
        <div
          aria-hidden="true"
          className="store-custom-sidebar store-stand-sidebar"
        >
          <div className="store-product-heading store-stand-heading">
            <div className="flex items-baseline justify-between gap-4">
              <Skeleton className="h-9 w-44 rounded-none" />
              <Skeleton className="store-skeleton-label w-20 shrink-0 rounded-none" />
            </div>
            <Skeleton className="store-skeleton-label w-36 rounded-none" />
          </div>
          <div className="store-custom-controls">
            <Skeleton className="h-11 w-full rounded-none" />
            <div className="store-custom-swatches">
              {["a", "b", "c", "d", "e", "f", "g"].map((slot) => (
                <div
                  className="store-custom-option store-custom-color"
                  key={slot}
                >
                  <Skeleton className="size-4 rounded-full" />
                </div>
              ))}
            </div>
            <div className="store-actions store-actions-single">
              <Skeleton className="store-button rounded-none" data-store-cta />
            </div>
            <div className="store-custom-details">
              <div className="store-custom-details-placeholder store-label">
                <Skeleton className="store-skeleton-label w-16 rounded-none" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
