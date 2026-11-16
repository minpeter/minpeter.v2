import { SiteIntroSkeleton, SiteNavSkeleton } from "@/components/site-nav";
import { Skeleton } from "@/components/ui/skeleton";

const SHOW_GROUPS = [
  { items: ["project-1", "project-2"], key: "projects" },
  {
    items: [
      "experiment-1",
      "experiment-2",
      "experiment-3",
      "experiment-4",
      "experiment-5",
      "experiment-6",
    ],
    key: "experiments",
  },
] as const;

export default function Loading() {
  return (
    <div aria-busy="true" className="site-page">
      <header>
        <SiteNavSkeleton />
        <SiteIntroSkeleton />
      </header>

      <div className="space-y-8">
        {SHOW_GROUPS.map(({ key, items }) => (
          <div key={key}>
            <Skeleton className="mb-3 h-3 w-20 rounded-sm" />
            <div className="showcase-list">
              {items.map((item) => (
                <div className="showcase-item-link" key={item}>
                  <div className="showcase-item-top">
                    <Skeleton className="h-4 w-44 rounded-sm" />
                    <Skeleton className="h-3 w-3 rounded-sm" />
                  </div>
                  <Skeleton className="h-3 w-64 max-w-full rounded-sm" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
