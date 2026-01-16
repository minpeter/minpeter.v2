"use client";

import dynamic from "next/dynamic";

import { Skeleton } from "@/components/ui/skeleton";

const Playground = dynamic(
  () => import("./animated-stack").then((mod) => mod.Playground),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[400px] w-[800px] rounded-lg" />,
  }
);

export function PlaygroundWrapper({ h, w }: { h: number; w: number }) {
  return <Playground h={h} w={w} />;
}
