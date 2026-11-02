import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div
      aria-busy="true"
      className="store-grid"
      data-testid="product-list-skeleton"
    >
      <div aria-hidden="true" className="store-card">
        <Skeleton className="aspect-[2/3] w-full rounded-none" />
        <div className="store-card-caption store-label opacity-100">
          <Skeleton className="store-skeleton-label w-20 rounded-none" />
          <Skeleton className="store-skeleton-label w-24 rounded-none" />
        </div>
      </div>
    </div>
  );
}
