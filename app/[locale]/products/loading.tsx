import { ProductMediaSkeleton } from "@/components/product-media-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import silhouette from "@/shared/maru60-silhouette.json" with { type: "json" };

export default function Loading() {
  return (
    <div
      aria-busy="true"
      className="store-grid"
      data-testid="product-list-skeleton"
    >
      <div aria-hidden="true" className="store-card">
        <ProductMediaSkeleton
          className="aspect-[2/3] rounded-none"
          outline={silhouette.outline}
        />
        <div className="store-card-caption store-label opacity-100">
          <Skeleton className="store-skeleton-label w-20 rounded-none" />
          <Skeleton className="store-skeleton-label w-24 rounded-none" />
        </div>
      </div>
    </div>
  );
}
