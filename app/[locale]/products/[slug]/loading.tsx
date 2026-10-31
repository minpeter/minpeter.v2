import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div aria-busy="true" className="store-product">
      <div className="store-media">
        <div className="store-media-stage">
          <Skeleton className="aspect-[4/3] w-full max-w-[56rem] rounded-none" />
        </div>
      </div>
      <div className="store-product-info">
        <Skeleton className="h-4 w-48 rounded-none" />
        <Skeleton className="h-10 w-full rounded-none" />
        <Skeleton className="h-24 w-full rounded-none" />
      </div>
    </div>
  );
}
