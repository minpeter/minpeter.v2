import { Skeleton } from "@/components/ui/skeleton";

const PARAGRAPHS = [
  { key: "p-1", width: "w-full" },
  { key: "p-2", width: "w-full" },
  { key: "p-3", width: "w-2/3" },
  { key: "p-4", width: "w-full" },
  { key: "p-5", width: "w-full" },
  { key: "p-6", width: "w-2/3" },
  { key: "p-7", width: "w-full" },
  { key: "p-8", width: "w-full" },
] as const;

export default function Loading() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-10 w-3/4" />
      <Skeleton className="h-4 w-48" />

      <div className="mt-8 flex flex-col gap-3">
        {PARAGRAPHS.map(({ key, width }) => (
          <Skeleton className={`h-4 ${width}`} key={key} />
        ))}
      </div>
    </div>
  );
}
