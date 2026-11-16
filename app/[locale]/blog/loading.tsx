import { SiteNavSkeleton } from "@/components/site-nav";
import { Skeleton } from "@/components/ui/skeleton";

const YEAR_GROUPS = ["group-1", "group-2", "group-3", "group-4"] as const;
const POSTS = ["post-1", "post-2", "post-3"] as const;

export default function Loading() {
  return (
    <div aria-busy="true" className="site-page fieldnotes-page">
      <header className="fieldnotes-header">
        <SiteNavSkeleton tools />
      </header>

      <div className="fieldnotes-search">
        <Skeleton className="bg-primary/5 h-8 w-full rounded-none" />
      </div>

      <div className="fieldnotes-list">
        {YEAR_GROUPS.map((groupKey) => (
          <section className="fieldnotes-year" key={groupKey}>
            <Skeleton className="mb-4 h-3 w-10 rounded-sm" />
            <ul className="post-rows">
              {POSTS.map((postKey) => (
                <li key={postKey}>
                  <div className="post-row">
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
