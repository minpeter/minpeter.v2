import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div aria-busy="true" className="store-grid">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
    </div>
  );
}
