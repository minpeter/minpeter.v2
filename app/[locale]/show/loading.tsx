import Image from "next/image";

import { Skeleton } from "@/components/ui/skeleton";

const SHOW_ITEMS = [
  "item-1",
  "item-2",
  "item-3",
  "item-4",
  "item-5",
  "item-6",
] as const;

export default function Loading() {
  return (
    <div aria-busy="true" className="showcase-page">
      <header className="showcase-header">
        <div className="fieldnotes-nav">
          <div aria-hidden="true" className="fieldnotes-logo-link">
            <Image
              alt=""
              aria-hidden="true"
              className="fieldnotes-logo"
              height={32}
              priority
              src="/assets/signature-mark.svg"
              width={32}
            />
          </div>
          <Skeleton className="h-3 w-12" />
        </div>
        <div className="showcase-intro">
          <Skeleton className="mb-3 h-3 w-16 rounded-sm" />
          <Skeleton className="mb-3 h-6 w-48 rounded-sm" />
          <Skeleton className="h-4 w-full max-w-sm rounded-sm" />
        </div>
      </header>

      <div className="showcase-list">
        {SHOW_ITEMS.map((key) => (
          <div className="showcase-item-link" key={key}>
            <div className="showcase-item-top">
              <Skeleton className="h-4 w-44 rounded-sm" />
              <Skeleton className="h-3 w-3 rounded-sm" />
            </div>
            <Skeleton className="h-3 w-64 max-w-full rounded-sm" />
          </div>
        ))}
      </div>
    </div>
  );
}
