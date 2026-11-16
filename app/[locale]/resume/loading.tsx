import { SiteIntroSkeleton, SiteNavSkeleton } from "@/components/site-nav";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div aria-busy="true" className="site-page resume-page">
      <header>
        <SiteNavSkeleton />
        <SiteIntroSkeleton />
      </header>

      <section className="resume-message">
        <Skeleton className="mb-3 h-4 w-28 rounded-sm" />
        <Skeleton className="mb-5 h-3 w-full max-w-xs rounded-sm" />
        <Skeleton className="h-3 w-20 rounded-sm" />
      </section>
    </div>
  );
}
