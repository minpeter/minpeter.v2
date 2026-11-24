import { ProductMediaSkeleton } from "@/components/product-media-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import maruSilhouette from "@/shared/maru60-silhouette.json" with {
  type: "json",
};
import standSilhouette from "@/shared/skateboard-stand-silhouette.json" with {
  type: "json",
};

const CATALOG_SILHOUETTES = [
  { id: "maru60", outline: maruSilhouette.outline },
  { id: "skateboard-stand", outline: standSilhouette.outline },
];

export default function Loading() {
  return (
    <div
      aria-busy="true"
      className="store-grid"
      data-testid="product-list-skeleton"
    >
      {CATALOG_SILHOUETTES.map((item) => (
        <div aria-hidden="true" className="store-card" key={item.id}>
          <ProductMediaSkeleton
            className="aspect-[2/3] w-full rounded-none"
            outline={item.outline}
          />
          <div className="store-card-caption store-label opacity-100">
            <Skeleton className="store-skeleton-label w-20 rounded-none" />
            <Skeleton className="store-skeleton-label w-24 rounded-none" />
          </div>
        </div>
      ))}
    </div>
  );
}
