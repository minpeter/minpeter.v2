import { SiteIntroSkeleton, SiteNavSkeleton } from "@/components/site-nav";
import { Skeleton } from "@/components/ui/skeleton";

const ENTRIES = ["entry-1", "entry-2", "entry-3"] as const;

export default function Loading() {
  return (
    <div aria-busy="true" className="site-page resume-page">
      <header>
        <SiteNavSkeleton />
        <SiteIntroSkeleton />
      </header>

      <Skeleton className="mb-3 h-3 w-12 rounded-sm" />
      <div className="resume-list mb-12">
        {ENTRIES.map((entry) => (
          <div className="resume-entry" key={entry}>
            <div className="resume-row">
              <Skeleton className="h-4 w-28 rounded-sm" />
              <Skeleton className="h-3 w-24 rounded-sm" />
            </div>
            <Skeleton className="mt-2 h-3 w-36 rounded-sm" />
          </div>
        ))}
      </div>

      <section className="resume-message">
        <Skeleton className="h-3 w-20 rounded-sm" />
      </section>
    </div>
  );
}
