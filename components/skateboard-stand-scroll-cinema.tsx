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

// Measured horizontal subject envelope (in 2560px source coordinates):
// Act I (F00–F06) holds the horizontal solo stand (max span ~1,740px -> 1,940px safe width).
// Act II–IV (F13.5–F59) holds the vertical docked board (max span ~545px -> 600px safe width).
const WIDE_SAFE_WIDTH = 1940;
const NARROW_SAFE_WIDTH = 600;
const TRANSITION_START_FRAME = 6;
const TRANSITION_END_FRAME = 13.5;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function getCinemaSafeWidth(frameProgress: number): number {
  if (frameProgress <= TRANSITION_START_FRAME) {
    return WIDE_SAFE_WIDTH;
  }
  if (frameProgress >= TRANSITION_END_FRAME) {
    return NARROW_SAFE_WIDTH;
  }
  const t =
    (frameProgress - TRANSITION_START_FRAME) /
    (TRANSITION_END_FRAME - TRANSITION_START_FRAME);
  const smooth = t * t * (3 - 2 * t);
  const eased = smooth ** 1.35;
  return WIDE_SAFE_WIDTH + (NARROW_SAFE_WIDTH - WIDE_SAFE_WIDTH) * eased;
}

export interface CinemaDrawRect {
  dh: number;
  dw: number;
  dx: number;
  dy: number;
  scale: number;
}

/**
 * Computes cover-or-safe-fit draw coordinates so landscape viewports stay full-bleed
 * while portrait mobile viewports smoothly keep Act I's wide stand uncropped and
 * zoom into full-height vertical framing once the upright board docks.
 */
export function computeCinemaDrawRect(
  viewportW: number,
  viewportH: number,
  sourceW: number,
  sourceH: number,
  frameProgress: number
): CinemaDrawRect {
  const coverScale = Math.max(viewportW / sourceW, viewportH / sourceH);
  const safeWidth =
    (getCinemaSafeWidth(frameProgress) / STAND_SCROLL_SEQUENCE.width) * sourceW;
  const safeScale = viewportW / safeWidth;
  const scale = Math.min(coverScale, safeScale);
  const dw = sourceW * scale;
  const dh = sourceH * scale;
  return {
    dh,
    dw,
    dx: (viewportW - dw) * 0.5,
    dy: (viewportH - dh) * 0.5,
    scale,
  };
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

function syncCanvasResolution(canvas: HTMLCanvasElement): {
  height: number;
  width: number;
} {
  const rect = canvas.getBoundingClientRect();
  if (rect.width > 0 && rect.height > 0) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const targetW = Math.max(1, Math.round(rect.width * dpr));
    const targetH = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }
    return { height: targetH, width: targetW };
  }
  return { height: canvas.height, width: canvas.width };
}

function drawFrameToCanvas(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  frameProgress: number
): number {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return 0;
  }
  const { width, height } = syncCanvasResolution(canvas);
  const sourceW = img.naturalWidth || STAND_SCROLL_SEQUENCE.width;
  const sourceH = img.naturalHeight || STAND_SCROLL_SEQUENCE.height;
  const rect = computeCinemaDrawRect(
    width,
    height,
    sourceW,
    sourceH,
    frameProgress
  );

  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, rect.dx, rect.dy, rect.dw, rect.dh);

  // When portrait safe-fit leaves pure-black letterbox space above the 16:9 frame
  // (e.g. F10–F12 as the board enters from y=0), feather the top edge into black so
  // the descending deck emerges seamlessly with no visible rectangular seam.
  if (rect.dy > 1) {
    const featherH = rect.dh * 0.14;
    const grad = ctx.createLinearGradient(0, rect.dy, 0, rect.dy + featherH);
    grad.addColorStop(0, "#000000");
    grad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, rect.dy - 1, width, featherH + 1);
  }

  return rect.scale;
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
  const drawnProgressRef = useRef(-1);
  const [activeFrame, setActiveFrame] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  const paintFrame = useCallback((frameProgress: number) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const clampedProgress = clamp(frameProgress, 0, TOTAL_FRAMES - 1);
    const clampedIndex = Math.round(clampedProgress);
    const img = findNearestLoaded(imagesRef.current, clampedIndex);
    if (!img) {
      return;
    }
    drawFrameToCanvas(canvas, img, clampedProgress);
    drawnFrameRef.current = clampedIndex;
    drawnProgressRef.current = clampedProgress;
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
              paintFrame(currentFrameRef.current);
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
    const repaint = () => paintFrame(frame);
    repaint();
    window.addEventListener("resize", repaint, { passive: true });
    return () => window.removeEventListener("resize", repaint);
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

      const progress = clamp(currentFrameRef.current, 0, TOTAL_FRAMES - 1);
      const frameIdx = Math.round(progress);
      const inZoomTransition =
        progress > TRANSITION_START_FRAME && progress < TRANSITION_END_FRAME;
      if (
        frameIdx !== drawnFrameRef.current ||
        (inZoomTransition &&
          Math.abs(progress - drawnProgressRef.current) > 0.02)
      ) {
        paintFrame(progress);
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

    const onResize = () => {
      onScroll();
      paintFrame(currentFrameRef.current);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
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
