"use client";
"use no memo";

import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";

import { cn } from "@/shared/utils/tailwind";

import { createPlayground } from "./playground-engine";

const CANVAS_FILTER = "grayscale(1)";

export function Playground({
  w,
  h,
  className,
}: {
  w: number;
  h: number;
  className?: string;
}) {
  const t = useTranslations("showcase.items.techStack");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    return createPlayground(canvas, w, h);
  }, [w, h]);

  return (
    <canvas
      aria-label={t("simulationLabel")}
      className={cn(
        "h-auto w-full max-w-full touch-none cursor-grab rounded-lg border bg-card text-card-foreground shadow-xs active:cursor-grabbing",
        className
      )}
      height={h}
      ref={canvasRef}
      role="img"
      style={{
        filter: CANVAS_FILTER,
      }}
      width={w}
    />
  );
}
