import { Skeleton } from "@/components/ui/skeleton";

const SHOW_ITEMS = [
  "item-1",
  "item-2",
  "item-3",
  "item-4",
  "item-5",
  "item-6",
] as const;

export default function Loading() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-8 w-32" />
      <div className="flex flex-col gap-2">
        {SHOW_ITEMS.map((key) => (
          <Skeleton className="h-6 w-48" key={key} />
        ))}
      </div>
    </div>
  );
}
