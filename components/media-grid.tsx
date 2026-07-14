import type { ReactNode } from "react";

import { cn } from "@/shared/utils/tailwind";

const columnClasses = {
  featured: "grid-cols-1 sm:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]",
  overview:
    "grid-cols-1 sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1.1fr)_minmax(0,0.75fr)]",
  two: "grid-cols-1 sm:grid-cols-2",
} as const;

interface MediaGridProps {
  readonly children: ReactNode;
  readonly className?: string;
  readonly columns?: keyof typeof columnClasses;
}

/** Reusable, responsive media layout for MDX articles. */
export const MediaGrid = ({
  children,
  className,
  columns = "two",
}: MediaGridProps) => (
  <div
    className={cn(
      "my-8 grid items-start gap-4",
      columnClasses[columns],
      "[&>p]:m-0 [&>p]:min-w-0 [&>p_[data-rmiz-content]]:block [&>p_[data-rmiz-content]]:w-full [&>p_[data-rmiz]]:block [&>p_[data-rmiz]]:w-full [&>p_img]:!m-0 [&>p_img]:block [&>p_img]:h-auto [&>p_img]:w-full",
      className
    )}
  >
    {children}
  </div>
);
