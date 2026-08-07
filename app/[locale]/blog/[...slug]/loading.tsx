import { Skeleton } from "@/components/ui/skeleton";

const BODY_LINES = ["line-1", "line-2", "line-3", "line-4", "line-5"] as const;

export default function Loading() {
  return (
    <section aria-busy="true" className="blog-post-page flex flex-1 flex-col">
      <header className="relative z-10 mx-auto mb-16 w-full max-w-2xl border-foreground/20 border-b pb-10 sm:mb-20">
        <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[-0.05em]">
          <Skeleton className="h-4 w-24 rounded-sm" />
          <Skeleton className="h-4 w-10 rounded-sm" />
        </div>
        <div className="mt-12 sm:mt-16">
          <Skeleton className="h-10 w-4/5 max-w-md rounded-sm sm:h-12" />
          <Skeleton className="mt-4 h-3 w-28 rounded-sm" />
        </div>
      </header>

      <div className="prose mx-auto w-full max-w-2xl space-y-3">
        {BODY_LINES.map((key, i) => (
          <Skeleton
            className={
              i === BODY_LINES.length - 1
                ? "h-4 w-2/3 rounded-sm"
                : "h-4 w-full rounded-sm"
            }
            key={key}
          />
        ))}
      </div>
    </section>
  );
}
