import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="showcase-page resume-page">
      <header className="showcase-header">
        <div className="fieldnotes-nav">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-3 w-12" />
        </div>
        <div className="showcase-intro">
          <Skeleton className="mb-3 h-3 w-12 rounded-sm" />
          <Skeleton className="mb-3 h-6 w-48 rounded-sm" />
          <Skeleton className="h-4 w-full max-w-sm rounded-sm" />
        </div>
      </header>

      <section className="resume-message">
        <Skeleton className="mb-3 h-4 w-28 rounded-sm" />
        <Skeleton className="mb-5 h-3 w-full max-w-xs rounded-sm" />
        <Skeleton className="h-3 w-20 rounded-sm" />
      </section>
    </div>
  );
}
