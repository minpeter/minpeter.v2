"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  getScrollSequenceFrameSrc,
  STAND_SCROLL_SEQUENCE,
} from "@/shared/skateboard-stand";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const TOTAL_FRAMES = STAND_SCROLL_SEQUENCE.frameCount;
const KEYFRAME_INDICES = [0, 8, 16, 25, 34, 42, 50, 59] as const;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function findNearestLoaded(
  images: readonly (HTMLImageElement | null)[],
  target: number
): HTMLImageElement | null {
  const exact = images[target];
  if (exact?.complete && exact.naturalWidth > 0) {
    return exact;
  }
  for (let offset = 1; offset < images.length; offset += 1) {
    const before = images[target - offset];
    if (before?.complete && before.naturalWidth > 0) {
      return before;
    }
    const after = images[target + offset];
    if (after?.complete && after.naturalWidth > 0) {
      return after;
    }
  }
  return null;
}

function drawFrameToCanvas(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }
  const { width, height } = canvas;
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);
}

export function SkateboardStandScrollCinema() {
  const t = useTranslations("products.standCustomization.cinema");
  const runwayRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<(HTMLImageElement | null)[]>(
    Array.from({ length: TOTAL_FRAMES }, () => null)
  );
  const currentFrameRef = useRef(0);
  const targetFrameRef = useRef(0);
  const drawnFrameRef = useRef(-1);
  const [activeFrame, setActiveFrame] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  const paintFrame = useCallback((frameIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const clamped = clamp(Math.round(frameIndex), 0, TOTAL_FRAMES - 1);
    const img = findNearestLoaded(imagesRef.current, clamped);
    if (!img) {
      return;
    }
    drawFrameToCanvas(canvas, img);
    drawnFrameRef.current = clamped;
  }, []);

  // Detect prefers-reduced-motion after hydration (keeps SSR & initial client render identical).
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    ) {
      return;
    }
    const media = window.matchMedia(REDUCED_MOTION_QUERY);
    const sync = () => setReducedMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  // Progressive keyframe-first preloader: draws initial frame immediately, then streams remaining frames in background.
  useEffect(() => {
    let cancelled = false;
    const store = imagesRef.current;

    const loadIndex = (index: number): Promise<void> => {
      const existing = store[index];
      if (existing) {
        return Promise.resolve();
      }
      return new Promise((resolve) => {
        const img = new window.Image();
        img.decoding = "async";
        const done = () => {
          if (!cancelled) {
            const wanted = clamp(
              Math.round(currentFrameRef.current),
              0,
              TOTAL_FRAMES - 1
            );
            if (index === wanted || drawnFrameRef.current === -1) {
              paintFrame(wanted);
            }
          }
          resolve();
        };
        img.onload = done;
        img.onerror = done;
        img.src = `${getScrollSequenceFrameSrc(index)}?v=${STAND_SCROLL_SEQUENCE.version}`;
        store[index] = img;
      });
    };

    const loadAll = async () => {
      if (reducedMotion) {
        await loadIndex(STAND_SCROLL_SEQUENCE.posterFrame);
        return;
      }
      // Phase 1: keyframe anchors so scrubbing anywhere on the runway has crisp art immediately.
      await Promise.all(KEYFRAME_INDICES.map(loadIndex));
      if (cancelled) {
        return;
      }
      // Phase 2: remaining frames in parallel batches of 6.
      const keySet = new Set<number>(KEYFRAME_INDICES);
      const rest: number[] = [];
      for (let i = 0; i < TOTAL_FRAMES; i += 1) {
        if (!keySet.has(i)) {
          rest.push(i);
        }
      }
      const batchSize = 6;
      const loadNextBatch = (start: number): Promise<void> => {
        if (cancelled || start >= rest.length) {
          return Promise.resolve();
        }
        return Promise.all(
          rest.slice(start, start + batchSize).map(loadIndex)
        ).then(() => loadNextBatch(start + batchSize));
      };
      await loadNextBatch(0);
    };

    loadAll();
    return () => {
      cancelled = true;
    };
  }, [paintFrame, reducedMotion]);

  // Paint crisp hero still when reduced-motion is active.
  useEffect(() => {
    if (!reducedMotion) {
      return;
    }
    const frame = STAND_SCROLL_SEQUENCE.posterFrame;
    currentFrameRef.current = frame;
    targetFrameRef.current = frame;
    paintFrame(frame);
  }, [paintFrame, reducedMotion]);

  // 60fps momentum-smoothed scroll scrubber (0% idle CPU when settled).
  useEffect(() => {
    if (reducedMotion) {
      return;
    }

    let rafId = 0;
    let lastReportedFrame = -1;

    const computeScrollProgress = () => {
      const el = runwayRef.current;
      if (!el) {
        return 0;
      }
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 800;
      const travel = Math.max(1, rect.height - vh);
      return clamp(-rect.top / travel, 0, 1);
    };

    const tick = () => {
      rafId = 0;
      const diff = targetFrameRef.current - currentFrameRef.current;
      if (Math.abs(diff) < 0.04) {
        currentFrameRef.current = targetFrameRef.current;
      } else {
        currentFrameRef.current += diff * 0.24;
        rafId = requestAnimationFrame(tick);
      }

      const frameIdx = clamp(
        Math.round(currentFrameRef.current),
        0,
        TOTAL_FRAMES - 1
      );
      if (frameIdx !== drawnFrameRef.current) {
        paintFrame(frameIdx);
      }
      if (frameIdx !== lastReportedFrame) {
        lastReportedFrame = frameIdx;
        setActiveFrame(frameIdx);
      }
    };

    const onScroll = () => {
      const progress = computeScrollProgress();
      targetFrameRef.current = progress * (TOTAL_FRAMES - 1);
      if (!rafId) {
        rafId = requestAnimationFrame(tick);
      }
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [paintFrame, reducedMotion]);

  return (
    <section
      aria-label={t("label")}
      className="store-cinema-runway"
      data-frame={activeFrame}
      data-reduced-motion={reducedMotion}
      data-testid="stand-scroll-cinema"
      ref={runwayRef}
    >
      <div className="store-cinema-sticky">
        <div className="store-cinema-frame">
          <canvas
            aria-label={t("label")}
            className="store-cinema-canvas"
            height={STAND_SCROLL_SEQUENCE.height}
            ref={canvasRef}
            role="img"
            width={STAND_SCROLL_SEQUENCE.width}
          />
        </div>
      </div>
    </section>
  );
}
