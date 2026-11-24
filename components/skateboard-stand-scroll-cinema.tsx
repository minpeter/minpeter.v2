"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  getScrollSequenceFrameSrc,
  STAND_SCROLL_SEQUENCE,
} from "@/shared/skateboard-stand";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const COARSE_POINTER_QUERY = "(pointer: coarse)";
const TOTAL_FRAMES = STAND_SCROLL_SEQUENCE.frameCount;
const DESKTOP_KEYFRAME_INDICES = [0, 8, 16, 25, 34, 42, 50, 59] as const;
const MOBILE_KEYFRAME_INDICES = [0, 8, 16, 24, 32, 40, 50, 59] as const;

// Mobile downscale target (1280×720): reduces decoded bitmap memory by ~8x on
// iOS Safari (31 frames ≈ 114 MB vs 60 QHD frames ≈ 885 MB) while staying sharp.
const MOBILE_BITMAP_WIDTH = 1280;
const MOBILE_BITMAP_HEIGHT = 720;

// Measured 2D subject envelope (in 2560×1440 source coordinates):
// - Horizontal: Act I (F00–F06) holds the wide solo stand (1,940px safe width);
//   Act II–IV (F13.5–F59) holds the narrow upright board (600px safe width).
// - Vertical: Act I (F00–F07) spans y∈[325..1149] (1,040px safe height);
//   by F10 the descending & upright board needs the full 1,440px frame height.
const WIDE_SAFE_WIDTH = 1940;
const NARROW_SAFE_WIDTH = 600;
const WIDTH_TRANSITION_START = 6;
const WIDTH_TRANSITION_END = 13.5;

const SOLO_SAFE_HEIGHT = 1040;
const BOARD_SAFE_HEIGHT = 1440;
const HEIGHT_TRANSITION_START = 7;
const HEIGHT_TRANSITION_END = 10;

type CinemaFrameSource = HTMLImageElement | ImageBitmap;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function isCompactMobileViewport(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  const coarse =
    typeof window.matchMedia === "function" &&
    window.matchMedia(COARSE_POINTER_QUERY).matches;
  return coarse || Math.min(window.innerWidth, window.innerHeight) <= 768;
}

function isLoadedFrame(
  frame: CinemaFrameSource | null | undefined
): frame is CinemaFrameSource {
  if (!frame) {
    return false;
  }
  if (typeof ImageBitmap !== "undefined" && frame instanceof ImageBitmap) {
    return frame.width > 0 && frame.height > 0;
  }
  const img = frame as HTMLImageElement;
  return Boolean(img.complete && img.naturalWidth > 0);
}

function getSourceDimensions(frame: CinemaFrameSource): {
  height: number;
  width: number;
} {
  if (typeof ImageBitmap !== "undefined" && frame instanceof ImageBitmap) {
    return { height: frame.height, width: frame.width };
  }
  const img = frame as HTMLImageElement;
  return {
    height: img.naturalHeight || STAND_SCROLL_SEQUENCE.height,
    width: img.naturalWidth || STAND_SCROLL_SEQUENCE.width,
  };
}

export function getCinemaSafeWidth(frameProgress: number): number {
  if (frameProgress <= WIDTH_TRANSITION_START) {
    return WIDE_SAFE_WIDTH;
  }
  if (frameProgress >= WIDTH_TRANSITION_END) {
    return NARROW_SAFE_WIDTH;
  }
  const t =
    (frameProgress - WIDTH_TRANSITION_START) /
    (WIDTH_TRANSITION_END - WIDTH_TRANSITION_START);
  const smooth = t * t * (3 - 2 * t);
  const eased = smooth ** 1.35;
  return WIDE_SAFE_WIDTH + (NARROW_SAFE_WIDTH - WIDE_SAFE_WIDTH) * eased;
}

export function getCinemaSafeHeight(frameProgress: number): number {
  if (frameProgress <= HEIGHT_TRANSITION_START) {
    return SOLO_SAFE_HEIGHT;
  }
  if (frameProgress >= HEIGHT_TRANSITION_END) {
    return BOARD_SAFE_HEIGHT;
  }
  const t =
    (frameProgress - HEIGHT_TRANSITION_START) /
    (HEIGHT_TRANSITION_END - HEIGHT_TRANSITION_START);
  const smooth = t * t * (3 - 2 * t);
  return SOLO_SAFE_HEIGHT + (BOARD_SAFE_HEIGHT - SOLO_SAFE_HEIGHT) * smooth;
}

export interface CinemaDrawRect {
  dh: number;
  dw: number;
  dx: number;
  dy: number;
  scale: number;
}

/**
 * Computes 2D safe-box draw coordinates across every aspect ratio (from 32:9
 * ultrawide and short desktop split windows down to 9:19.5 mobile portrait):
 * never crops the active subject horizontally or vertically while preserving
 * full-bleed cover framing whenever the viewport ratio allows it.
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
  const safeHeight =
    (getCinemaSafeHeight(frameProgress) / STAND_SCROLL_SEQUENCE.height) *
    sourceH;
  const scale = Math.min(
    coverScale,
    viewportW / safeWidth,
    viewportH / safeHeight
  );
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

export function findNearestLoadedFrame<T>(
  frames: readonly (T | null)[],
  target: number,
  isReady: (item: T | null | undefined) => item is T
): { frame: T; index: number } | null {
  const exact = frames[target];
  if (isReady(exact)) {
    return { frame: exact, index: target };
  }
  for (let offset = 1; offset < frames.length; offset += 1) {
    const beforeIdx = target - offset;
    const before = frames[beforeIdx];
    if (beforeIdx >= 0 && isReady(before)) {
      return { frame: before, index: beforeIdx };
    }
    const afterIdx = target + offset;
    const after = frames[afterIdx];
    if (afterIdx < frames.length && isReady(after)) {
      return { frame: after, index: afterIdx };
    }
  }
  return null;
}

function syncCanvasResolution(
  canvas: HTMLCanvasElement,
  mobile: boolean
): { height: number; width: number } {
  const rect = canvas.getBoundingClientRect();
  if (rect.width > 0 && rect.height > 0) {
    const maxDpr = mobile ? 1.5 : 2;
    const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
    const targetW = Math.max(1, Math.round(rect.width * dpr));
    const targetH = Math.max(1, Math.round(rect.height * dpr));
    if (
      Math.abs(canvas.width - targetW) > 2 ||
      Math.abs(canvas.height - targetH) > 2
    ) {
      canvas.width = targetW;
      canvas.height = targetH;
    }
    return { height: canvas.height, width: canvas.width };
  }
  return { height: canvas.height, width: canvas.width };
}

function drawFrameToCanvas(
  canvas: HTMLCanvasElement,
  frame: CinemaFrameSource,
  frameProgress: number,
  mobile: boolean
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }
  const { width, height } = syncCanvasResolution(canvas, mobile);
  const { width: sourceW, height: sourceH } = getSourceDimensions(frame);
  const rect = computeCinemaDrawRect(
    width,
    height,
    sourceW,
    sourceH,
    frameProgress
  );

  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(frame, rect.dx, rect.dy, rect.dw, rect.dh);

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
}

function closeFrameSource(frame: CinemaFrameSource | null | undefined): void {
  if (typeof ImageBitmap !== "undefined" && frame instanceof ImageBitmap) {
    frame.close();
  }
}

function buildRemainingIndices(
  keyframes: readonly number[],
  mobile: boolean
): number[] {
  const keySet = new Set<number>(keyframes);
  const step = mobile ? 2 : 1;
  const rest: number[] = [];
  for (let i = 0; i < TOTAL_FRAMES; i += step) {
    if (!keySet.has(i)) {
      rest.push(i);
    }
  }
  const lastIndex = TOTAL_FRAMES - 1;
  if (!(keySet.has(lastIndex) || rest.includes(lastIndex))) {
    rest.push(lastIndex);
  }
  return rest;
}

function fetchRawImage(
  index: number,
  highPriority: boolean
): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.decoding = "async";
    if (highPriority && "fetchPriority" in img) {
      (img as HTMLImageElement & { fetchPriority: string }).fetchPriority =
        "high";
    }
    img.onload = () => resolve(img.naturalWidth > 0 ? img : null);
    img.onerror = () => resolve(null);
    img.src = `${getScrollSequenceFrameSrc(index)}?v=${STAND_SCROLL_SEQUENCE.version}`;
  });
}

async function downscaleForMobile(
  img: HTMLImageElement,
  scratch: HTMLCanvasElement | null
): Promise<CinemaFrameSource> {
  if (typeof createImageBitmap !== "function" || !scratch) {
    return img;
  }
  const ctx = scratch.getContext("2d");
  if (!ctx) {
    return img;
  }
  try {
    ctx.clearRect(0, 0, scratch.width, scratch.height);
    ctx.drawImage(img, 0, 0, scratch.width, scratch.height);
    const bitmap = await createImageBitmap(scratch);
    // Release the full-resolution 2560×1440 image decode promptly on iOS Safari.
    img.src = "";
    return bitmap;
  } catch {
    return img;
  }
}

export function SkateboardStandScrollCinema() {
  const t = useTranslations("products.standCustomization.cinema");
  const runwayRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<(CinemaFrameSource | null)[]>(
    Array.from({ length: TOTAL_FRAMES }, () => null)
  );
  const mobileRef = useRef<boolean>(false);
  const currentFrameRef = useRef(0);
  const targetFrameRef = useRef(0);
  const drawnSourceIndexRef = useRef(-1);
  const drawnProgressRef = useRef(-1);
  const [activeFrame, setActiveFrame] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  const paintFrame = useCallback((frameProgress: number) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const clampedProgress = clamp(frameProgress, 0, TOTAL_FRAMES - 1);
    const wantedIndex = Math.round(clampedProgress);
    const found = findNearestLoadedFrame(
      framesRef.current,
      wantedIndex,
      isLoadedFrame
    );
    if (!found) {
      return;
    }
    drawFrameToCanvas(canvas, found.frame, clampedProgress, mobileRef.current);
    drawnSourceIndexRef.current = found.index;
    drawnProgressRef.current = clampedProgress;
  }, []);

  // Detect prefers-reduced-motion after hydration (keeps SSR & initial client render identical).
  // Under reduced motion we disable momentum inertia and scrub 1:1 with user scroll instead of freezing.
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

  // Progressive keyframe-first preloader:
  // - Mobile: 31 frames downscaled to 1280×720 GPU ImageBitmaps (~114 MB, 2x faster on LTE).
  // - Desktop: all 60 frames at full QHD (2560×1440).
  useEffect(() => {
    let cancelled = false;
    const mobile = isCompactMobileViewport();
    mobileRef.current = mobile;
    const store = framesRef.current;
    const scratch =
      mobile && typeof document !== "undefined"
        ? Object.assign(document.createElement("canvas"), {
            height: MOBILE_BITMAP_HEIGHT,
            width: MOBILE_BITMAP_WIDTH,
          })
        : null;

    const repaintIfCloser = (loadedIndex: number) => {
      if (cancelled) {
        return;
      }
      const wanted = clamp(
        Math.round(currentFrameRef.current),
        0,
        TOTAL_FRAMES - 1
      );
      const prevDrawn = drawnSourceIndexRef.current;
      const prevDist =
        prevDrawn === -1
          ? Number.POSITIVE_INFINITY
          : Math.abs(prevDrawn - wanted);
      if (Math.abs(loadedIndex - wanted) < prevDist) {
        paintFrame(currentFrameRef.current);
      }
    };

    const loadIndex = async (
      index: number,
      highPriority: boolean
    ): Promise<void> => {
      if (isLoadedFrame(store[index])) {
        repaintIfCloser(index);
        return;
      }
      const img = await fetchRawImage(index, highPriority);
      if (!img || cancelled) {
        return;
      }
      const prepared = mobile ? await downscaleForMobile(img, scratch) : img;
      if (cancelled) {
        closeFrameSource(prepared);
        return;
      }
      store[index] = prepared;
      repaintIfCloser(index);
    };

    const loadAll = async () => {
      const keyframes = mobile
        ? MOBILE_KEYFRAME_INDICES
        : DESKTOP_KEYFRAME_INDICES;
      // Phase 1: keyframe anchors so scrubbing anywhere on the runway has crisp art immediately.
      await Promise.all(keyframes.map((idx) => loadIndex(idx, true)));
      if (cancelled) {
        return;
      }
      // Phase 2: remaining frames (step=2 on mobile for 31 total frames; step=1 on desktop for 60).
      const rest = buildRemainingIndices(keyframes, mobile);
      const batchSize = mobile ? 4 : 6;
      const runBatch = async (start: number): Promise<void> => {
        if (cancelled || start >= rest.length) {
          return;
        }
        await Promise.all(
          rest
            .slice(start, start + batchSize)
            .map((idx) => loadIndex(idx, false))
        );
        await runBatch(start + batchSize);
      };
      await runBatch(0);
    };

    loadAll();
    return () => {
      cancelled = true;
      for (let i = 0; i < store.length; i += 1) {
        const item = store[i];
        closeFrameSource(item);
        if (typeof ImageBitmap !== "undefined" && item instanceof ImageBitmap) {
          store[i] = null;
        }
      }
    };
  }, [paintFrame]);

  // 60fps scroll scrubber:
  // Uses an IntersectionObserver-gated rAF loop while the runway is in/near the
  // viewport so iOS Safari and mobile WebViews update smoothly even when touch
  // momentum throttles window `scroll` events, while using 0% CPU off-screen.
  useEffect(() => {
    let rafId = 0;
    let inView = true;
    let lastReportedFrame = -1;

    const computeScrollProgress = () => {
      const el = runwayRef.current;
      if (!el) {
        return 0;
      }
      const rect = el.getBoundingClientRect();
      const vh = window.visualViewport?.height || window.innerHeight || 800;
      const travel = Math.max(1, rect.height - vh);
      return clamp(-rect.top / travel, 0, 1);
    };

    const stepFrame = () => {
      const progress = computeScrollProgress();
      targetFrameRef.current = progress * (TOTAL_FRAMES - 1);

      const diff = targetFrameRef.current - currentFrameRef.current;
      if (reducedMotion || Math.abs(diff) < 0.05) {
        currentFrameRef.current = targetFrameRef.current;
      } else {
        const ease = mobileRef.current ? 0.36 : 0.24;
        currentFrameRef.current += diff * ease;
      }

      const clampedProgress = clamp(
        currentFrameRef.current,
        0,
        TOTAL_FRAMES - 1
      );
      const wantedIndex = Math.round(clampedProgress);
      const found = findNearestLoadedFrame(
        framesRef.current,
        wantedIndex,
        isLoadedFrame
      );
      const inZoomTransition =
        clampedProgress > WIDTH_TRANSITION_START &&
        clampedProgress < WIDTH_TRANSITION_END;

      if (
        found &&
        (found.index !== drawnSourceIndexRef.current ||
          (inZoomTransition &&
            Math.abs(clampedProgress - drawnProgressRef.current) > 0.02))
      ) {
        paintFrame(clampedProgress);
      }

      if (wantedIndex !== lastReportedFrame) {
        lastReportedFrame = wantedIndex;
        setActiveFrame(wantedIndex);
      }
    };

    const loop = () => {
      rafId = 0;
      stepFrame();
      const settling =
        Math.abs(targetFrameRef.current - currentFrameRef.current) >= 0.05;
      if (inView || settling) {
        rafId = requestAnimationFrame(loop);
      }
    };

    const ensureLoop = () => {
      if (!rafId) {
        rafId = requestAnimationFrame(loop);
      }
    };

    const onResize = () => {
      mobileRef.current = isCompactMobileViewport();
      stepFrame();
      paintFrame(currentFrameRef.current);
      ensureLoop();
    };

    const runwayEl = runwayRef.current;
    const io =
      typeof IntersectionObserver !== "undefined" && runwayEl
        ? new IntersectionObserver(
            (entries) => {
              inView = entries.some((entry) => entry.isIntersecting);
              if (inView) {
                ensureLoop();
              }
            },
            { rootMargin: "240px 0px" }
          )
        : null;
    if (io && runwayEl) {
      io.observe(runwayEl);
    }

    const resizeObserver =
      typeof ResizeObserver !== "undefined" && canvasRef.current
        ? new ResizeObserver(onResize)
        : null;
    if (resizeObserver && canvasRef.current) {
      resizeObserver.observe(canvasRef.current);
    }

    stepFrame();
    ensureLoop();

    window.addEventListener("scroll", ensureLoop, { passive: true });
    window.addEventListener("touchmove", ensureLoop, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    window.visualViewport?.addEventListener("scroll", ensureLoop, {
      passive: true,
    });
    window.visualViewport?.addEventListener("resize", onResize, {
      passive: true,
    });

    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      io?.disconnect();
      resizeObserver?.disconnect();
      window.removeEventListener("scroll", ensureLoop);
      window.removeEventListener("touchmove", ensureLoop);
      window.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener("scroll", ensureLoop);
      window.visualViewport?.removeEventListener("resize", onResize);
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
