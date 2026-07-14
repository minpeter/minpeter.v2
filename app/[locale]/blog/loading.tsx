import { Skeleton } from "@/components/ui/skeleton";

const YEAR_GROUPS = ["group-1", "group-2", "group-3"] as const;
const POSTS = ["post-1", "post-2"] as const;

export default function Loading() {
  return (
    <div className="fieldnotes-page">
      <header className="fieldnotes-header">
        <div className="fieldnotes-nav">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-8" />
            <Skeleton className="h-3 w-8" />
          </div>
        </div>
      </header>

      <div className="fieldnotes-search">
        <Skeleton className="h-8 w-full rounded-none bg-primary/5" />
      </div>

      <div className="fieldnotes-list">
        {YEAR_GROUPS.map((groupKey) => (
          <section className="fieldnotes-year" key={groupKey}>
            <Skeleton className="mb-4 h-3 w-10 rounded-sm" />
            <ul className="fieldnotes-year-posts">
              {POSTS.map((postKey) => (
                <li className="fieldnotes-item" key={postKey}>
                  <div className="fieldnotes-item-link">
                    <Skeleton className="h-4 w-3/5 rounded-sm" />
                    <Skeleton className="h-3 w-24 rounded-sm" />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
