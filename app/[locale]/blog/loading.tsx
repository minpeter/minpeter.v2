import { Skeleton } from "@/components/ui/skeleton";

const YEAR_GROUPS = ["group-1", "group-2", "group-3"] as const;
const POSTS = ["post-1", "post-2"] as const;

export default function Loading() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="mb-6 h-8 w-48" />
      <Skeleton className="mb-8 h-4 w-32" />

      {YEAR_GROUPS.map((groupKey) => (
        <div
          className="flex flex-col gap-2 border-t py-8 sm:flex-row"
          key={groupKey}
        >
          <Skeleton className="h-6 w-16" />
          <div className="flex w-full flex-col gap-3">
            {POSTS.map((postKey) => (
              <div className="flex justify-between" key={postKey}>
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-5 w-16" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
