import type { ReactNode } from "react";
import { ProductMediaSkeleton } from "@/components/product-media-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import silhouette from "@/shared/skateboard-stand-silhouette.json" with {
  type: "json",
};

const COLOR_SLOTS = [
  "cobalt",
  "charcoal",
  "bone",
  "ash",
  "ice",
  "green",
  "marble",
];
const VIEW_SLOTS = ["board", "stand"];

export function SkateboardStandCustomizerSkeleton({
  actions,
  intro,
}: {
  actions?: ReactNode;
  intro?: ReactNode;
} = {}) {
  return (
    <div
      aria-busy="true"
      className="store-customizer store-customizer-minimal"
      data-testid="skateboard-stand-customizer-skeleton"
    >
      <div aria-hidden="true" className="store-custom-visual">
        <div className="store-media-stage">
          <ProductMediaSkeleton
            className="store-media-skeleton rounded-none"
            outline={silhouette.outline}
          />
        </div>
      </div>
      <div className="store-custom-sidebar store-stand-sidebar">
        {intro}
        <div aria-hidden="true" className="store-custom-controls">
          <fieldset disabled>
            <div className="store-view-toggle">
              {VIEW_SLOTS.map((slot) => (
                <Skeleton className="h-11 rounded-none" key={slot} />
              ))}
            </div>
          </fieldset>
          <fieldset disabled>
            <legend className="store-label">
              <Skeleton className="store-skeleton-label w-24 rounded-none" />
            </legend>
            <div className="store-custom-swatches">
              {COLOR_SLOTS.map((slot) => (
                <div
                  className="store-custom-option store-custom-color"
                  key={slot}
                >
                  <Skeleton className="size-4 rounded-full" />
                </div>
              ))}
            </div>
          </fieldset>
          {actions}
          <div className="store-custom-details">
            <div className="store-custom-details-placeholder store-label">
              <Skeleton className="store-skeleton-label w-16 rounded-none" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
