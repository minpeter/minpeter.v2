"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";

import { Skeleton } from "@/components/ui/skeleton";

export function PlaygroundWrapper({ h, w }: { h: number; w: number }) {
  const Playground = useMemo(
    () =>
      dynamic(() => import("./animated-stack").then((mod) => mod.Playground), {
        ssr: false,
        loading: () => (
          <Skeleton
            className="rounded-lg"
            style={{ height: `${h}px`, width: `${w}px` }}
          />
        ),
      }),
    [h, w]
  );

  return <Playground h={h} w={w} />;
}
