import { Skeleton } from "@/components/ui/skeleton";

const CONTENT_BLOCKS = [
  { heading: false, key: "intro", lines: ["w-full", "w-11/12", "w-3/4"] },
  { heading: true, key: "section-1", lines: ["w-full", "w-10/12", "w-2/3"] },
  { heading: true, key: "section-2", lines: ["w-full", "w-4/5"] },
] as const;

export default function Loading() {
  return (
    <section aria-busy="true" className="blog-post-page">
      <header className="relative z-10 mx-auto mb-16 w-full max-w-2xl border-foreground/20 border-b pb-10 sm:mb-20">
        <div className="flex h-7 items-center justify-between">
          <Skeleton className="h-3 w-14 rounded-sm" />
          <Skeleton className="h-3 w-10 rounded-sm" />
        </div>

        <div className="mt-12 sm:mt-16">
          <div className="flex flex-col gap-0">
            <Skeleton className="h-12 w-full rounded-sm sm:w-3/4" />
            <Skeleton className="h-12 w-4/5 rounded-sm sm:w-1/2" />
          </div>
          <div className="mt-5 flex h-6 items-center">
            <Skeleton className="h-3 w-24 rounded-sm" />
          </div>
        </div>
      </header>

      <div className="prose flex-1">
        <div className="flex flex-col gap-8" data-blog-body="">
          {CONTENT_BLOCKS.map(({ heading, key, lines }) => (
            <section className="flex flex-col gap-3" key={key}>
              {heading ? <Skeleton className="h-5 w-40 rounded-sm" /> : null}
              <div className="flex flex-col gap-2">
                {lines.map((width) => (
                  <Skeleton
                    className={`h-3.5 ${width} rounded-sm`}
                    key={width}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}
