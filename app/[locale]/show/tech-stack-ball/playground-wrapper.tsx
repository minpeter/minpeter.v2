"use client";

import dynamic from "next/dynamic";
import type { CSSProperties } from "react";

import { Skeleton } from "@/components/ui/skeleton";

interface PlaygroundProps {
  readonly h: number;
  readonly w: number;
}

interface PlaygroundFrameStyle extends CSSProperties {
  readonly "--playground-aspect-ratio": string;
  readonly "--playground-width": string;
}

const playgroundSkeletonStyle = {
  aspectRatio: "var(--playground-aspect-ratio)",
  height: "auto",
  maxWidth: "100%",
  width: "var(--playground-width)",
} satisfies CSSProperties;

const Playground = dynamic<PlaygroundProps>(
  () => import("./animated-stack").then((mod) => mod.Playground),
  {
    ssr: false,
    loading: () => (
      <Skeleton className="rounded-lg" style={playgroundSkeletonStyle} />
    ),
  }
);

export function PlaygroundWrapper({ h, w }: PlaygroundProps) {
  const playgroundFrameStyle: PlaygroundFrameStyle = {
    "--playground-aspect-ratio": `${w} / ${h}`,
    "--playground-width": `${w}px`,
  };

  return (
    <div className="contents" style={playgroundFrameStyle}>
      <Playground h={h} w={w} />
    </div>
  );
}
