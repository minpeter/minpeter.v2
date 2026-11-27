"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  getScrollSequenceFrameSrc,
  STAND_SCROLL_SEQUENCE,
} from "@/shared/skateboard-stand";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const COARSE_POINTER_QUERY = "(pointer: coarse)";
const TOTAL_FRAMES = STAND_SCROLL_SEQUENCE.frameCount;
const KEYFRAME_INDICES = [0, 8, 16, 25, 34, 42, 50, 59] as const;

// Bounded mobile scrub cache: at most 16 decoded 1024×576 bitmaps (~38 MiB peak onscreen,
// 0 MiB offscreen after 450ms eviction), paired with a 160ms zero-persistent-RAM full QHD
// (2560×1440) idle settle paint for Retina sharpness on @3x phones and tablets.
const MOBILE_BITMAP_WIDTH = 1024;
const MOBILE_BITMAP_HEIGHT = 576;
export const MOBILE_MAX_DECODED_BITMAPS = 16;
const MOBILE_WINDOW_OFFSETS = [0, -2, 2, -4, 4, -6, 6] as const;
const MOBILE_REFINE_DELAY_MS = 160;
const MOBILE_OFFSCREEN_EVICT_MS = 450;

const MAX_DESKTOP_BACKING_H = 2160;
const MAX_MOBILE_BACKING_H = 1920;

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

export function isCompactMobileViewport(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  const coarse =
    typeof window.matchMedia === "function" &&
    window.matchMedia(COARSE_POINTER_QUERY).matches;
  return coarse || window.innerWidth <= 768;
}

function isImageBitmapSource(
  frame: CinemaFrameSource | null | undefined
): frame is ImageBitmap {
  return typeof ImageBitmap !== "undefined" && frame instanceof ImageBitmap;
}

function isLoadedFrame(
  frame: CinemaFrameSource | null | undefined
): frame is CinemaFrameSource {
  if (!frame) {
    return false;
  }
  if (isImageBitmapSource(frame)) {
    return frame.width > 0 && frame.height > 0;
  }
  const img = frame as HTMLImageElement;
  return Boolean(img.complete && img.naturalWidth > 0);
}

function getSourceDimensions(frame: CinemaFrameSource): {
  height: number;
  width: number;
} {
  if (isImageBitmapSource(frame)) {
    return { height: frame.height, width: frame.width };
  }
  const img = frame as HTMLImageElement;
  return {
    height: img.naturalHeight || STAND_SCROLL_SEQUENCE.height,
    width: img.naturalWidth || STAND_SCROLL_SEQUENCE.width,
  };
}

function countActiveMobileFrames(
  store: readonly (CinemaFrameSource | null)[]
): number {
  let count = 0;
  for (const item of store) {
    if (isLoadedFrame(item)) {
      count += 1;
    }
  }
  return count;
}

function closeFrameSource(frame: CinemaFrameSource | null | undefined): void {
  if (isImageBitmapSource(frame)) {
    frame.close();
  }
}

export function evictBitmapsToBudget<T>(
  store: (T | null)[],
  anchorFrame: number,
  protectedFrame: number,
  maxCount: number,
  isManaged: (item: T | null | undefined) => item is T,
  release?: (item: T) => void
): number {
  const activeIndices: number[] = [];
  for (let i = 0; i < store.length; i += 1) {
    if (isManaged(store[i])) {
      activeIndices.push(i);
    }
  }
  if (activeIndices.length <= maxCount) {
    return 0;
  }
  activeIndices.sort(
    (a, b) => Math.abs(b - anchorFrame) - Math.abs(a - anchorFrame)
  );
  let evicted = 0;
  let remaining = activeIndices.length;
  for (const idx of activeIndices) {
    if (remaining <= maxCount) {
      break;
    }
    if (idx === anchorFrame || idx === protectedFrame) {
      continue;
    }
    const item = store[idx];
    if (isManaged(item)) {
      if (release) {
        release(item);
      } else if (
        typeof item === "object" &&
        item !== null &&
        "close" in item &&
        typeof (item as { close?: unknown }).close === "function"
      ) {
        (item as { close: () => void }).close();
      }
      store[idx] = null;
      evicted += 1;
      remaining -= 1;
    }
  }
  return evicted;
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

export function getRunwayScrollProgress(runwayEl: HTMLElement): number {
  const rect = runwayEl.getBoundingClientRect();
  const vh = window.visualViewport?.height || window.innerHeight || 800;
  const travel = rect.height - vh;
  if (travel <= 0) {
    return 0;
  }
  return clamp(-rect.top / travel, 0, 1);
}

export function buildPriorityLoadOrder(
  targetFrame: number,
  mobile: boolean
): { keyframes: number[]; rest: number[]; start: number } {
  const start = clamp(Math.round(targetFrame), 0, TOTAL_FRAMES - 1);
  const seen = new Set<number>([start]);
  const byProximity = (a: number, b: number) =>
    Math.abs(a - start) - Math.abs(b - start);

  const keyframes = KEYFRAME_INDICES.filter((idx) => {
    if (seen.has(idx)) {
      return false;
    }
    seen.add(idx);
    return true;
  }).sort(byProximity);

  const step = mobile ? 2 : 1;
  const rest: number[] = [];
  for (let i = 0; i < TOTAL_FRAMES; i += step) {
    if (!seen.has(i)) {
      seen.add(i);
      rest.push(i);
    }
  }
  const lastIndex = TOTAL_FRAMES - 1;
  if (!seen.has(lastIndex)) {
    rest.push(lastIndex);
  }
  rest.sort(byProximity);

  return { keyframes, rest, start };
}

/**
 * Syncs canvas pixel dimensions ONLY on mount & ResizeObserver (never per-frame)
 * to guarantee zero forced layout reflows during scroll scrubbing.
 */
function resizeCanvasBacking(
  canvas: HTMLCanvasElement,
  cssW: number,
  cssH: number,
  mobile: boolean
): boolean {
  if (cssW <= 0 || cssH <= 0) {
    return false;
  }
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const maxH = mobile ? MAX_MOBILE_BACKING_H : MAX_DESKTOP_BACKING_H;
  const scale = Math.max(1, Math.min(dpr, maxH / cssH));
  const targetW = Math.max(1, Math.round(cssW * scale));
  const targetH = Math.max(1, Math.round(cssH * scale));
  const resized =
    Math.abs(canvas.width - targetW) > 2 ||
    Math.abs(canvas.height - targetH) > 2;
  if (resized) {
    canvas.width = targetW;
    canvas.height = targetH;
  }
  return resized;
}

function drawFrameToCanvas(
  canvas: HTMLCanvasElement,
  frame: CinemaFrameSource,
  frameProgress: number
): boolean {
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) {
    return false;
  }
  const { width, height } = canvas;
  if (width <= 0 || height <= 0) {
    return false;
  }
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
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
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
  return true;
}

function setCanvasVisibility(
  canvas: HTMLCanvasElement,
  poster: HTMLImageElement | null,
  ready: boolean
): void {
  canvas.dataset.ready = ready ? "true" : "false";
  if (poster) {
    poster.dataset.hidden = ready ? "true" : "false";
  }
}

function yieldToMainThread(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 16);
  });
}

function getVersionedFrameSrc(index: number): string {
  return `${getScrollSequenceFrameSrc(index)}?v=${STAND_SCROLL_SEQUENCE.version}`;
}

function loadHtmlImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.decoding = "async";
    img.onload = () => resolve(img.naturalWidth > 0 ? img : null);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/**
 * Deduplicates and caches compressed WebP blobs (~60 KB each) so mobile scrub
 * decodes, offscreen re-entries, and 160ms full-res idle settle never issue
 * duplicate network requests or touch a shared scratch canvas.
 */
function fetchCinemaBlob(
  index: number,
  blobCache: Map<number, Blob>,
  inFlight: Map<number, Promise<Blob | null>>
): Promise<Blob | null> {
  const cached = blobCache.get(index);
  if (cached) {
    return Promise.resolve(cached);
  }
  const existing = inFlight.get(index);
  if (existing) {
    return existing;
  }
  if (typeof fetch !== "function") {
    return Promise.resolve(null);
  }
  const src = getVersionedFrameSrc(index);
  const request = fetch(src)
    .then(async (response) => {
      if (!response.ok) {
        return null;
      }
      const blob = await response.blob();
      blobCache.set(index, blob);
      return blob;
    })
    .catch(() => null)
    .finally(() => {
      inFlight.delete(index);
    });
  inFlight.set(index, request);
  return request;
}

async function decodeMobileScrubBitmap(
  index: number,
  blobCache: Map<number, Blob>,
  inFlight: Map<number, Promise<Blob | null>>
): Promise<CinemaFrameSource | null> {
  if (typeof fetch === "function" && typeof createImageBitmap === "function") {
    try {
      const blob = await fetchCinemaBlob(index, blobCache, inFlight);
      if (blob) {
        return await createImageBitmap(blob, {
          resizeHeight: MOBILE_BITMAP_HEIGHT,
          resizeQuality: "high",
          resizeWidth: MOBILE_BITMAP_WIDTH,
        });
      }
    } catch {
      // Fall back to standard Image decoding below.
    }
  }
  return loadHtmlImage(getVersionedFrameSrc(index));
}

async function decodeFullResCinemaBitmap(
  index: number,
  blobCache: Map<number, Blob>,
  inFlight: Map<number, Promise<Blob | null>>
): Promise<ImageBitmap | null> {
  if (typeof fetch !== "function" || typeof createImageBitmap !== "function") {
    return null;
  }
  try {
    const blob = await fetchCinemaBlob(index, blobCache, inFlight);
    if (!blob) {
      return null;
    }
    return await createImageBitmap(blob);
  } catch {
    return null;
  }
}

export function SkateboardStandScrollCinema() {
  const t = useTranslations("products.standCustomization.cinema");
  const runwayRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const posterRef = useRef<HTMLImageElement>(null);
  const framesRef = useRef<(CinemaFrameSource | null)[]>(
    Array.from({ length: TOTAL_FRAMES }, () => null)
  );
  // Holds at most 1 outgoing frame across a tier switch until the incoming tier paints,
  // guaranteeing zero black frames across consecutive resizes even when poster/network stall.
  const bridgeFrameRef = useRef<CinemaFrameSource | null>(null);
  const blobCacheRef = useRef<Map<number, Blob>>(new Map());
  const blobInFlightRef = useRef<Map<number, Promise<Blob | null>>>(new Map());
  const mobileRef = useRef<boolean>(false);
  const inViewRef = useRef<boolean>(false);
  const currentFrameRef = useRef(0);
  const targetFrameRef = useRef(0);
  const drawnSourceIndexRef = useRef(-1);
  const drawnProgressRef = useRef(-1);
  const refinedFrameRef = useRef(-1);
  const scheduleRefineRef = useRef<((index: number) => void) | null>(null);
  const syncOnReEntryRef = useRef<(() => void) | null>(null);
  const [engaged, setEngaged] = useState(false);
  const [inView, setInView] = useState(false);
  const [compactMobile, setCompactMobile] = useState(false);
  const [activeFrame, setActiveFrame] = useState(0);
  const [canvasReady, setCanvasReady] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const clearBridgeFrame = useCallback(() => {
    if (bridgeFrameRef.current) {
      closeFrameSource(bridgeFrameRef.current);
      bridgeFrameRef.current = null;
    }
  }, []);

  const releaseAllFrames = useCallback(
    (
      closeOnlyBitmaps = false,
      preserveFrame: CinemaFrameSource | null = null
    ) => {
      const store = framesRef.current;
      for (let i = 0; i < store.length; i += 1) {
        const item = store[i];
        if (item === preserveFrame && preserveFrame !== null) {
          store[i] = null;
          continue;
        }
        if (isImageBitmapSource(item)) {
          item.close();
          store[i] = null;
        } else if (!closeOnlyBitmaps && item !== null) {
          store[i] = null;
        }
      }
      if (preserveFrame === null) {
        clearBridgeFrame();
      } else {
        if (
          bridgeFrameRef.current &&
          bridgeFrameRef.current !== preserveFrame
        ) {
          closeFrameSource(bridgeFrameRef.current);
        }
        bridgeFrameRef.current = preserveFrame;
      }
      drawnSourceIndexRef.current = -1;
      drawnProgressRef.current = -1;
      refinedFrameRef.current = -1;
    },
    [clearBridgeFrame]
  );

  const paintFrame = useCallback(
    (frameProgress: number): boolean => {
      const canvas = canvasRef.current;
      if (!canvas) {
        return false;
      }
      const clampedProgress = clamp(frameProgress, 0, TOTAL_FRAMES - 1);
      const wantedIndex = Math.round(clampedProgress);
      const found = findNearestLoadedFrame(
        framesRef.current,
        wantedIndex,
        isLoadedFrame
      );
      const source = found?.frame ?? bridgeFrameRef.current;
      if (!isLoadedFrame(source)) {
        return false;
      }
      const painted = drawFrameToCanvas(canvas, source, clampedProgress);
      if (!painted) {
        return false;
      }
      if (found) {
        clearBridgeFrame();
        drawnSourceIndexRef.current = found.index;
      } else {
        drawnSourceIndexRef.current = -1;
      }
      drawnProgressRef.current = clampedProgress;
      setCanvasVisibility(canvas, posterRef.current, true);
      setCanvasReady((ready) => (ready ? ready : true));
      return true;
    },
    [clearBridgeFrame]
  );

  // Detect prefers-reduced-motion after hydration (keeps SSR & first paint identical).
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    ) {
      return;
    }
    const media = window.matchMedia(REDUCED_MOTION_QUERY);
    const sync = () => {
      setReducedMotion(media.matches);
      if (media.matches) {
        releaseAllFrames(false);
        setCanvasReady(false);
        setActiveFrame(STAND_SCROLL_SEQUENCE.posterFrame);
      }
    };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, [releaseAllFrames]);

  // Gate preloading until the visitor scrolls into the cinema (0 network contention with
  // hero turntable at y=0, including tall desktop displays), and evict mobile frames offscreen.
  useEffect(() => {
    const prefersReduced =
      reducedMotion ||
      (typeof window !== "undefined" &&
        typeof window.matchMedia === "function" &&
        window.matchMedia(REDUCED_MOTION_QUERY).matches);
    if (prefersReduced) {
      inViewRef.current = false;
      setInView(false);
      return;
    }
    const runwayEl = runwayRef.current;
    if (!runwayEl) {
      return;
    }
    if (typeof IntersectionObserver === "undefined") {
      const mobileNow = isCompactMobileViewport();
      mobileRef.current = mobileNow;
      setCompactMobile(mobileNow);
      inViewRef.current = true;
      setInView(true);
      setEngaged(true);
      return;
    }
    let offscreenTimer: ReturnType<typeof setTimeout> | null = null;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((entry) => entry.isIntersecting);
        if (visible) {
          if (offscreenTimer !== null) {
            clearTimeout(offscreenTimer);
            offscreenTimer = null;
          }
          const mobileNow = isCompactMobileViewport();
          mobileRef.current = mobileNow;
          setCompactMobile(mobileNow);
          inViewRef.current = true;
          setInView(true);
          setEngaged(true);
          syncOnReEntryRef.current?.();
        } else {
          inViewRef.current = false;
          setInView(false);
          if (
            (mobileRef.current || bridgeFrameRef.current !== null) &&
            offscreenTimer === null
          ) {
            offscreenTimer = setTimeout(() => {
              offscreenTimer = null;
              if (inViewRef.current) {
                return;
              }
              if (mobileRef.current) {
                releaseAllFrames(false);
              } else {
                clearBridgeFrame();
              }
            }, MOBILE_OFFSCREEN_EVICT_MS);
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px" }
    );
    io.observe(runwayEl);
    return () => {
      io.disconnect();
      if (offscreenTimer !== null) {
        clearTimeout(offscreenTimer);
      }
    };
  }, [clearBridgeFrame, reducedMotion, releaseAllFrames]);

  // Progressive keyframe-first preloader (starts once engaged & in view; bounded GPU budget on mobile).
  useEffect(() => {
    if (!(engaged && inView) || reducedMotion) {
      return;
    }
    let cancelled = false;
    const mobile = compactMobile;
    mobileRef.current = mobile;
    const store = framesRef.current;
    const blobCache = blobCacheRef.current;
    const inFlight = blobInFlightRef.current;

    const repaintIfCloser = (loadedIndex: number) => {
      if (cancelled) {
        return;
      }
      const wanted = clamp(
        Math.round(currentFrameRef.current),
        0,
        TOTAL_FRAMES - 1
      );
      if (
        refinedFrameRef.current === wanted &&
        drawnSourceIndexRef.current === wanted
      ) {
        return;
      }
      const prevDrawn = drawnSourceIndexRef.current;
      const prevDist =
        prevDrawn === -1
          ? Number.POSITIVE_INFINITY
          : Math.abs(prevDrawn - wanted);
      if (Math.abs(loadedIndex - wanted) < prevDist) {
        paintFrame(currentFrameRef.current);
      }
      if (mobile) {
        scheduleRefineRef.current?.(wanted);
      }
    };

    const loadDesktopIndex = async (index: number): Promise<void> => {
      const existing = store[index];
      if (
        isLoadedFrame(existing) &&
        getSourceDimensions(existing).width >= STAND_SCROLL_SEQUENCE.width
      ) {
        repaintIfCloser(index);
        return;
      }
      const frame = await loadHtmlImage(getVersionedFrameSrc(index));
      if (!frame || cancelled || mobileRef.current) {
        return;
      }
      closeFrameSource(store[index]);
      store[index] = frame;
      repaintIfCloser(index);
    };

    const loadMobileIndex = async (
      index: number,
      decodeNow: boolean
    ): Promise<void> => {
      if (cancelled || !inViewRef.current || !mobileRef.current) {
        return;
      }
      if (!decodeNow) {
        // Warm compressed WebP blob (~60 KB) only so scrubbing never stalls on network,
        // without allocating an uncompressed GPU ImageBitmap until near the playhead.
        await fetchCinemaBlob(index, blobCache, inFlight);
        return;
      }
      if (isLoadedFrame(store[index])) {
        repaintIfCloser(index);
        return;
      }
      const frame = await decodeMobileScrubBitmap(index, blobCache, inFlight);
      if (!frame) {
        return;
      }
      if (cancelled || !inViewRef.current || !mobileRef.current) {
        closeFrameSource(frame);
        return;
      }
      closeFrameSource(store[index]);
      store[index] = frame;
      const anchor = clamp(
        Math.round(currentFrameRef.current),
        0,
        TOTAL_FRAMES - 1
      );
      evictBitmapsToBudget(
        store,
        anchor,
        drawnSourceIndexRef.current,
        MOBILE_MAX_DECODED_BITMAPS,
        isLoadedFrame,
        closeFrameSource
      );
      repaintIfCloser(index);
    };

    const runBatches = async (
      indices: readonly number[],
      batchSize: number,
      loadOne: (idx: number) => Promise<void>,
      start = 0
    ): Promise<void> => {
      if (cancelled || !inViewRef.current || start >= indices.length) {
        return;
      }
      await Promise.all(
        indices.slice(start, start + batchSize).map((idx) => loadOne(idx))
      );
      await yieldToMainThread();
      await runBatches(indices, batchSize, loadOne, start + batchSize);
    };

    const loadAll = async () => {
      const runwayEl = runwayRef.current;
      const liveFrame = runwayEl
        ? getRunwayScrollProgress(runwayEl) * (TOTAL_FRAMES - 1)
        : currentFrameRef.current;
      if (runwayEl) {
        currentFrameRef.current = liveFrame;
        targetFrameRef.current = liveFrame;
      }
      const { keyframes, rest, start } = buildPriorityLoadOrder(
        liveFrame,
        mobile
      );

      if (!mobile) {
        await loadDesktopIndex(start);
        await runBatches(keyframes, 4, loadDesktopIndex);
        if (cancelled) {
          return;
        }
        await runBatches(rest, 4, loadDesktopIndex);
        return;
      }

      await loadMobileIndex(start, true);
      scheduleRefineRef.current?.(start);
      const headroom = Math.max(
        0,
        MOBILE_MAX_DECODED_BITMAPS - 2 - countActiveMobileFrames(store)
      );
      if (headroom > 0) {
        await runBatches(keyframes.slice(0, headroom), 4, (idx) =>
          loadMobileIndex(idx, true)
        );
      }
      if (cancelled || !inViewRef.current) {
        return;
      }
      await runBatches(rest, 3, (idx) => loadMobileIndex(idx, false));
    };

    loadAll();
    return () => {
      cancelled = true;
    };
  }, [compactMobile, engaged, inView, paintFrame, reducedMotion]);

  // Always release any live frames on unmount.
  useEffect(() => () => releaseAllFrames(false), [releaseAllFrames]);

  // Event-driven scroll scrubber (zero idle rAF polling; zero per-frame layout reflow).
  useEffect(() => {
    if (!engaged || reducedMotion) {
      return;
    }
    const runwayEl = runwayRef.current;
    const canvasEl = canvasRef.current;
    if (!(runwayEl && canvasEl)) {
      return;
    }

    let cancelled = false;
    let rafId = 0;
    let lastReportedFrame = -1;
    let refineTimer: ReturnType<typeof setTimeout> | null = null;
    let pendingRefineIndex = -1;
    let refineToken = 0;
    const windowDecoding = new Set<number>();

    const cancelRefine = () => {
      refineToken += 1;
      pendingRefineIndex = -1;
      if (refineTimer !== null) {
        clearTimeout(refineTimer);
        refineTimer = null;
      }
    };

    const commitWindowFrame = (idx: number, frame: CinemaFrameSource) => {
      if (cancelled || !inViewRef.current || !mobileRef.current) {
        closeFrameSource(frame);
        return;
      }
      const store = framesRef.current;
      closeFrameSource(store[idx]);
      store[idx] = frame;
      const anchor = clamp(
        Math.round(currentFrameRef.current),
        0,
        TOTAL_FRAMES - 1
      );
      evictBitmapsToBudget(
        store,
        anchor,
        drawnSourceIndexRef.current,
        MOBILE_MAX_DECODED_BITMAPS,
        isLoadedFrame,
        closeFrameSource
      );
      if (
        refinedFrameRef.current === anchor &&
        drawnSourceIndexRef.current === anchor
      ) {
        return;
      }
      const prevDrawn = drawnSourceIndexRef.current;
      const prevDist =
        prevDrawn === -1
          ? Number.POSITIVE_INFINITY
          : Math.abs(prevDrawn - anchor);
      if (Math.abs(idx - anchor) < prevDist) {
        paintFrame(currentFrameRef.current);
      }
    };

    const decodeWindowFrame = (idx: number) => {
      windowDecoding.add(idx);
      decodeMobileScrubBitmap(
        idx,
        blobCacheRef.current,
        blobInFlightRef.current
      )
        .then((frame) => {
          if (frame) {
            commitWindowFrame(idx, frame);
          }
        })
        .finally(() => {
          windowDecoding.delete(idx);
        });
    };

    const ensureMobileWindow = (wantedIndex: number) => {
      if (!(mobileRef.current && inViewRef.current)) {
        return;
      }
      const store = framesRef.current;
      const baseEven = wantedIndex - (wantedIndex % 2);
      for (const offset of MOBILE_WINDOW_OFFSETS) {
        const idx = clamp(baseEven + offset, 0, TOTAL_FRAMES - 1);
        if (isLoadedFrame(store[idx]) || windowDecoding.has(idx)) {
          continue;
        }
        decodeWindowFrame(idx);
      }
    };

    const scheduleMobileRefine = (wantedIndex: number) => {
      if (
        !(mobileRef.current && inViewRef.current) ||
        refinedFrameRef.current === wantedIndex
      ) {
        return;
      }
      const exactCached = framesRef.current[wantedIndex];
      if (
        isLoadedFrame(exactCached) &&
        getSourceDimensions(exactCached).width >= STAND_SCROLL_SEQUENCE.width
      ) {
        cancelRefine();
        return;
      }
      if (pendingRefineIndex === wantedIndex) {
        return;
      }
      cancelRefine();
      pendingRefineIndex = wantedIndex;
      const token = refineToken;
      refineTimer = setTimeout(() => {
        refineTimer = null;
        if (cancelled || !inViewRef.current || !mobileRef.current) {
          if (token === refineToken) {
            pendingRefineIndex = -1;
          }
          return;
        }
        decodeFullResCinemaBitmap(
          wantedIndex,
          blobCacheRef.current,
          blobInFlightRef.current
        )
          .then((bitmap) => {
            if (!bitmap) {
              return;
            }
            try {
              const liveProgress = clamp(
                currentFrameRef.current,
                0,
                TOTAL_FRAMES - 1
              );
              if (
                cancelled ||
                !inViewRef.current ||
                !mobileRef.current ||
                token !== refineToken ||
                Math.round(liveProgress) !== wantedIndex
              ) {
                return;
              }
              const painted = drawFrameToCanvas(canvasEl, bitmap, liveProgress);
              if (!painted) {
                return;
              }
              drawnSourceIndexRef.current = wantedIndex;
              drawnProgressRef.current = liveProgress;
              refinedFrameRef.current = wantedIndex;
              clearBridgeFrame();
              setCanvasVisibility(canvasEl, posterRef.current, true);
              setCanvasReady((ready) => (ready ? ready : true));
            } finally {
              bitmap.close();
            }
          })
          .finally(() => {
            if (token === refineToken) {
              pendingRefineIndex = -1;
            }
          });
      }, MOBILE_REFINE_DELAY_MS);
    };

    scheduleRefineRef.current = scheduleMobileRefine;

    const syncCanvasToPlayhead = (
      clampedProgress: number,
      wantedIndex: number,
      zoomMoved: boolean
    ) => {
      if (
        refinedFrameRef.current === wantedIndex &&
        drawnSourceIndexRef.current === wantedIndex &&
        !zoomMoved
      ) {
        return;
      }
      if (wantedIndex !== refinedFrameRef.current || zoomMoved) {
        refinedFrameRef.current = -1;
      }
      const found = findNearestLoadedFrame(
        framesRef.current,
        wantedIndex,
        isLoadedFrame
      );
      if (found && (found.index !== drawnSourceIndexRef.current || zoomMoved)) {
        paintFrame(clampedProgress);
      }
      ensureMobileWindow(wantedIndex);
      scheduleMobileRefine(wantedIndex);
    };

    const stepFrame = (snap = false) => {
      const nextTarget = getRunwayScrollProgress(runwayEl) * (TOTAL_FRAMES - 1);
      targetFrameRef.current = nextTarget;

      const diff = nextTarget - currentFrameRef.current;
      if (snap || Math.abs(diff) < 0.05) {
        currentFrameRef.current = nextTarget;
      } else {
        currentFrameRef.current += diff * (mobileRef.current ? 0.36 : 0.24);
      }

      const clampedProgress = clamp(
        currentFrameRef.current,
        0,
        TOTAL_FRAMES - 1
      );
      const wantedIndex = Math.round(clampedProgress);
      const inZoomTransition =
        clampedProgress > WIDTH_TRANSITION_START &&
        clampedProgress < WIDTH_TRANSITION_END;
      const zoomMoved =
        inZoomTransition &&
        Math.abs(clampedProgress - drawnProgressRef.current) > 0.02;

      syncCanvasToPlayhead(clampedProgress, wantedIndex, zoomMoved);

      if (wantedIndex !== lastReportedFrame) {
        lastReportedFrame = wantedIndex;
        setActiveFrame(wantedIndex);
      }
    };

    const loop = () => {
      rafId = 0;
      stepFrame(false);
      if (Math.abs(targetFrameRef.current - currentFrameRef.current) >= 0.05) {
        rafId = requestAnimationFrame(loop);
      }
    };

    const ensureLoop = () => {
      if (rafId || cancelled) {
        return;
      }
      if (
        !inViewRef.current &&
        Math.abs(targetFrameRef.current - currentFrameRef.current) < 0.05
      ) {
        return;
      }
      rafId = requestAnimationFrame(loop);
    };

    const repaintAfterResize = (resized: boolean, tierChanged: boolean) => {
      refinedFrameRef.current = -1;
      const liveTarget = getRunwayScrollProgress(runwayEl) * (TOTAL_FRAMES - 1);
      targetFrameRef.current = liveTarget;
      currentFrameRef.current = liveTarget;
      const wantedIndex = clamp(Math.round(liveTarget), 0, TOTAL_FRAMES - 1);
      if (tierChanged) {
        // Keep only the single currently-painted frame as a bridge while onscreen
        // until the incoming tier paints; never retain a bridge while already offscreen.
        const preserveIndex =
          drawnSourceIndexRef.current >= 0
            ? drawnSourceIndexRef.current
            : wantedIndex;
        const outgoing = inViewRef.current
          ? (findNearestLoadedFrame(
              framesRef.current,
              preserveIndex,
              isLoadedFrame
            )?.frame ?? bridgeFrameRef.current)
          : null;
        releaseAllFrames(false, outgoing ?? null);
      }
      const painted = paintFrame(liveTarget);
      if (resized && !painted) {
        setCanvasVisibility(canvasEl, posterRef.current, false);
        setCanvasReady(false);
      }
      if (wantedIndex !== lastReportedFrame) {
        lastReportedFrame = wantedIndex;
        setActiveFrame(wantedIndex);
      }
      ensureMobileWindow(wantedIndex);
      scheduleMobileRefine(wantedIndex);
    };

    const syncCanvasSize = () => {
      const rect = canvasEl.getBoundingClientRect();
      const prevMobile = mobileRef.current;
      const nextMobile = isCompactMobileViewport();
      mobileRef.current = nextMobile;
      setCompactMobile(nextMobile);
      const resized = resizeCanvasBacking(
        canvasEl,
        rect.width,
        rect.height,
        nextMobile
      );
      const tierChanged = prevMobile !== nextMobile;
      if (tierChanged) {
        cancelRefine();
      }
      if (resized || tierChanged || drawnSourceIndexRef.current === -1) {
        repaintAfterResize(resized, tierChanged);
      }
    };

    const syncOnReEntry = () => {
      stepFrame(true);
      const wantedIndex = clamp(
        Math.round(currentFrameRef.current),
        0,
        TOTAL_FRAMES - 1
      );
      paintFrame(currentFrameRef.current);
      ensureMobileWindow(wantedIndex);
      scheduleMobileRefine(wantedIndex);
    };

    syncOnReEntryRef.current = syncOnReEntry;

    // Initialize immediately at live scroll position (supports mid-page reload cleanly).
    syncCanvasSize();
    stepFrame(true);

    const onVisibility = () => {
      if (document.visibilityState === "visible" && inViewRef.current) {
        refinedFrameRef.current = -1;
        syncOnReEntry();
      }
    };

    const onPageShow = () => {
      syncCanvasSize();
      stepFrame(true);
    };

    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(syncCanvasSize);
    resizeObserver?.observe(canvasEl);

    window.addEventListener("scroll", ensureLoop, { passive: true });
    window.addEventListener("touchmove", ensureLoop, { passive: true });
    window.addEventListener("resize", syncCanvasSize, { passive: true });
    window.addEventListener("pageshow", onPageShow);
    document.addEventListener("visibilitychange", onVisibility);
    window.visualViewport?.addEventListener("scroll", ensureLoop, {
      passive: true,
    });
    window.visualViewport?.addEventListener("resize", syncCanvasSize, {
      passive: true,
    });

    return () => {
      cancelled = true;
      cancelRefine();
      scheduleRefineRef.current = null;
      syncOnReEntryRef.current = null;
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      resizeObserver?.disconnect();
      window.removeEventListener("scroll", ensureLoop);
      window.removeEventListener("touchmove", ensureLoop);
      window.removeEventListener("resize", syncCanvasSize);
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("visibilitychange", onVisibility);
      window.visualViewport?.removeEventListener("scroll", ensureLoop);
      window.visualViewport?.removeEventListener("resize", syncCanvasSize);
    };
  }, [clearBridgeFrame, engaged, paintFrame, reducedMotion, releaseAllFrames]);

  const posterFrame = reducedMotion ? STAND_SCROLL_SEQUENCE.posterFrame : 0;
  const posterSrc = getVersionedFrameSrc(posterFrame);
  const showPoster = engaged || reducedMotion;

  return (
    <section
      aria-label={reducedMotion ? undefined : t("label")}
      className="store-cinema-runway"
      data-frame={
        reducedMotion ? STAND_SCROLL_SEQUENCE.posterFrame : activeFrame
      }
      data-reduced-motion={reducedMotion}
      data-testid="stand-scroll-cinema"
      ref={runwayRef}
    >
      <div className="store-cinema-sticky">
        <div className="store-cinema-frame">
          {showPoster ? (
            <Image
              alt={reducedMotion ? t("label") : ""}
              aria-hidden={reducedMotion ? undefined : true}
              className="store-cinema-poster"
              data-hidden={canvasReady && !reducedMotion}
              height={STAND_SCROLL_SEQUENCE.height}
              loading="lazy"
              ref={posterRef}
              sizes="100vw"
              src={posterSrc}
              unoptimized
              width={STAND_SCROLL_SEQUENCE.width}
            />
          ) : null}
          {reducedMotion ? null : (
            <canvas
              className="store-cinema-canvas"
              data-ready={canvasReady}
              inert
              ref={canvasRef}
            />
          )}
        </div>
      </div>
    </section>
  );
}
