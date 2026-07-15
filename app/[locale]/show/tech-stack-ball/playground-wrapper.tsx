"use client";

import { ReloadIcon } from "@radix-ui/react-icons";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";

interface PlaygroundProps {
  readonly className?: string;
  readonly h: number;
  readonly w: number;
}

interface PlaygroundDimensions {
  height: number;
  width: number;
}

const Playground = dynamic<PlaygroundProps>(
  () => import("./animated-stack").then((mod) => mod.Playground),
  {
    loading: () => <Skeleton className="h-full w-full rounded-none" />,
    ssr: false,
  }
);

export function PlaygroundWrapper({ className, h, w }: PlaygroundProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<PlaygroundDimensions | null>(
    null
  );
  const [runId, setRunId] = useState(0);

  useEffect(() => {
    const frame = frameRef.current;

    if (!frame) {
      return;
    }

    let animationFrameId = 0;
    const updateDimensions = (width: number) => {
      window.cancelAnimationFrame(animationFrameId);
      animationFrameId = window.requestAnimationFrame(() => {
        const nextDimensions = {
          height: Math.max(1, Math.round(width * (h / w))),
          width: Math.max(1, Math.round(width)),
        };

        setDimensions((currentDimensions) => {
          if (
            currentDimensions?.height === nextDimensions.height &&
            currentDimensions.width === nextDimensions.width
          ) {
            return currentDimensions;
          }

          return nextDimensions;
        });
      });
    };
    const resizeObserver = new ResizeObserver(([entry]) => {
      updateDimensions(entry?.contentRect.width ?? frame.clientWidth);
    });

    resizeObserver.observe(frame);
    updateDimensions(frame.clientWidth);

    return () => {
      resizeObserver.disconnect();
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [h, w]);

  const handleReplay = useCallback(() => {
    setRunId((currentRunId) => currentRunId + 1);
  }, []);

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-foreground/10 bg-secondary/20">
        <div ref={frameRef} style={{ aspectRatio: `${w} / ${h}` }}>
          {dimensions ? (
            <Playground
              className={className}
              h={dimensions.height}
              key={`${runId}-${dimensions.width}x${dimensions.height}`}
              w={dimensions.width}
            />
          ) : (
            <Skeleton className="h-full w-full rounded-none" />
          )}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-4 text-[0.6875rem] text-muted-foreground leading-relaxed">
        <p>Drag an icon and let the physics take over.</p>
        <button
          className="inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-1 transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={handleReplay}
          type="button"
        >
          <ReloadIcon aria-hidden="true" className="size-3" />
          Replay
        </button>
      </div>
    </>
  );
}
