import { Skeleton } from "@/components/ui/skeleton";

const HOUSING_SLOTS = [
  "transparent",
  "white",
  "gray",
  "charcoal",
  "blue",
  "purple",
  "green",
  "marble",
];
const KEYCAP_SLOTS = ["inventor", "retro", "bow", "wob", "noel", "purple"];
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
export default function Loading() {
  return (
    <div
      aria-busy="true"
      className="store-product"
      data-testid="product-detail-skeleton"
    >
      <div aria-hidden="true" className="store-customizer">
        <div className="store-media-stage">
          <Skeleton className="store-media-skeleton rounded-none" />
        </div>
        <div className="store-custom-controls">
          <fieldset disabled>
            <legend className="store-label">
              <Skeleton className="store-skeleton-label w-32 rounded-none" />
            </legend>
            <div className="store-custom-swatches">
              {HOUSING_SLOTS.map((slot) => (
                <div
                  className="store-custom-option store-custom-color"
                  key={slot}
                >
                  <Skeleton className="size-6 rounded-full" />
                </div>
              ))}
            </div>
          </fieldset>
          <fieldset disabled>
            <legend className="store-label">
              <Skeleton className="store-skeleton-label w-20 rounded-none" />
            </legend>
            <div className="store-custom-kits">
              {KEYCAP_SLOTS.map((slot) => (
                <div
                  className="store-custom-option store-custom-kit"
                  key={slot}
                >
                  <Skeleton className="aspect-square w-4/5 rounded-none" />
                </div>
              ))}
            </div>
          </fieldset>
          <div className="store-custom-details">
            <div className="store-custom-details-placeholder store-label">
              <Skeleton className="store-skeleton-label w-40 rounded-none" />
            </div>
          </div>
        </div>
      </div>
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
    </div>
  );
}
