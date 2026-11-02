import { ProductMediaSkeleton } from "@/components/product-media-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import keycapSilhouettes from "@/shared/keycap-silhouettes.json" with {
  type: "json",
};
import silhouette from "@/shared/maru60-silhouette.json" with { type: "json" };

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
const KEYCAP_SLOTS = [
  "inventor",
  "retro-programmer-retail",
  "nicepbt-bow-retail",
  "pbtfans-wob-retail",
  "nicepbt-noel-latin-retail",
  "nicepbt-purple-chonkers-retail",
] as const;

/** Shared by the route fallback and the customizer-only streaming boundary. */
export function ProductCustomizerSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-hidden="true"
      className="store-customizer"
      data-testid="product-customizer-skeleton"
    >
      <div className="store-media-stage">
        <ProductMediaSkeleton
          className="store-media-skeleton rounded-none"
          outline={silhouette.outline}
        />
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
              <div className="store-custom-option store-custom-kit" key={slot}>
                <ProductMediaSkeleton
                  className="aspect-square w-4/5 rounded-none"
                  outline={keycapSilhouettes[slot]}
                />
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
  );
}
