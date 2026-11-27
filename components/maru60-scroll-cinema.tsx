"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  getMaru60CinemaBeat,
  getMaru60CinemaFrameSrc,
  MARU60_SCROLL_SEQUENCE,
  type Maru60CinemaBeat,
} from "@/shared/maru60-cinema";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const COARSE_POINTER_QUERY = "(pointer: coarse)";
const TOTAL_FRAMES = MARU60_SCROLL_SEQUENCE.frameCount;

// 14 keyframe anchors covering every act, Disney transition peak & hero stop.
const KEYFRAME_INDICES = [
  0, 8, 16, 23, 32, 43, 52, 62, 71, 84, 88, 100, 112, 119,
] as const;

// Static hero frame shown under `prefers-reduced-motion: reduce` (full Charcoal + WoB front).
const REDUCED_MOTION_HERO_FRAME = 8;

// Source frames are 1440×1800 (2× Retina desktop) and 640×800 ImageBitmaps (bounded mobile scrub
// cache), with a zero-persistent-RAM full-res 1440×1800 idle settle paint on mobile.
const MAX_DESKTOP_BACKING_H = 2160;
const MAX_MOBILE_BACKING_H = 1920;

// Bounded mobile GPU budget: at most 20 decoded 640×800 bitmaps (~41 MiB peak onscreen, 0 offscreen).
const MOBILE_BITMAP_WIDTH = 640;
const MOBILE_BITMAP_HEIGHT = 800;
export const MOBILE_MAX_DECODED_BITMAPS = 20;
const MOBILE_WINDOW_OFFSETS = [0, -2, 2, -4, 4, -6, 6, -8, 8] as const;
const MOBILE_REFINE_DELAY_MS = 160;
const MOBILE_OFFSCREEN_EVICT_MS = 450;
const LINEUP_SLOTS = [0, 1, 2, 3, 4, 5, 6, 7] as const;

type CinemaFrameSource = HTMLImageElement | ImageBitmap;

interface CachedFeather {
  bot: CanvasGradient;
  botY: number;
  dh: number;
  dw: number;
  dx: number;
  dy: number;
  key: string;
  left: CanvasGradient | null;
  right: CanvasGradient | null;
  sideBand: number;
  top: CanvasGradient;
  topBand: number;
}

let scrollTriggerRegistered = false;

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
    height: img.naturalHeight || MARU60_SCROLL_SEQUENCE.height,
    width: img.naturalWidth || MARU60_SCROLL_SEQUENCE.width,
  };
}

function countActiveMobileBitmaps(
  store: readonly (CinemaFrameSource | null)[]
): number {
  let count = 0;
  for (const item of store) {
    if (isImageBitmapSource(item)) {
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

/**
 * Evicts farthest decoded bitmaps from the playhead until active count <= `maxCount`,
 * closing every evicted GPU texture while protecting the active & drawn frames.
 */
export function evictBitmapsToBudget<T extends { close: () => void }>(
  store: (T | null)[],
  anchorFrame: number,
  protectedFrame: number,
  maxCount: number,
  isManaged: (item: T | null | undefined) => item is T
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
      item.close();
      store[idx] = null;
      evicted += 1;
      remaining -= 1;
    }
  }
  return evicted;
}

export interface Maru60CinemaDrawRect {
  dh: number;
  dw: number;
  dx: number;
  dy: number;
  featherAlpha: number;
  featherEdges: boolean;
  scale: number;
}

function smoothstep01(t: number): number {
  const u = clamp(t, 0, 1);
  return u * u * (3 - 2 * u);
}

/**
 * Computes responsive draw coordinates for the 4:5 (1440×1800) Maru60 sequence
 * across all viewport ratios (32:9 ultrawide, short split desktop, tablets,
 * and narrow portrait phones) without clipping hardware or colliding with HUD text.
 * Smoothly interpolates framing and edge feathering across the Act II -> III dive
 * so there is never an abrupt box-size jump.
 */
export function computeMaru60CinemaRect(
  viewportW: number,
  viewportH: number,
  sourceW: number,
  sourceH: number,
  frameIndex: number,
  backingScale = 1
): Maru60CinemaDrawRect {
  const blendStart = MARU60_SCROLL_SEQUENCE.macroBlendStartFrame;
  const blendEnd = MARU60_SCROLL_SEQUENCE.macroStartFrame;
  const bleedT = smoothstep01(
    (frameIndex - blendStart) / Math.max(1, blendEnd - blendStart)
  );

  const s = Math.max(1, backingScale);
  const topSafe = clamp(viewportH * 0.04, 24 * s, 44 * s);
  const bottomSafe = clamp(viewportH * 0.095, 56 * s, 84 * s);
  const sideSafe =
    viewportW < 640 * s ? 12 * s : clamp(viewportW * 0.05, 24 * s, 64 * s);

  const availW = Math.max(1, viewportW - sideSafe * 2);
  const availH = Math.max(1, viewportH - topSafe - bottomSafe);
  const safeScale = Math.min(availW / sourceW, availH / sourceH);
  const safeDw = sourceW * safeScale;
  const safeDh = sourceH * safeScale;
  const safeDy = topSafe + (availH - safeDh) * 0.5;

  const fullMaxW = Math.min(viewportW, viewportH * 1.15);
  const fullScale = Math.min(fullMaxW / sourceW, viewportH / sourceH);
  const fullDw = sourceW * fullScale;
  const fullDh = sourceH * fullScale;
  const fullDy = (viewportH - fullDh) * 0.5;

  const scale = safeScale + (fullScale - safeScale) * bleedT;
  const dw = safeDw + (fullDw - safeDw) * bleedT;
  const dh = safeDh + (fullDh - safeDh) * bleedT;
  const dy = safeDy + (fullDy - safeDy) * bleedT;

  return {
    dh,
    dw,
    dx: (viewportW - dw) * 0.5,
    dy,
    featherAlpha: bleedT,
    featherEdges: bleedT > 0.001,
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

/**
 * Syncs canvas pixel dimensions ONLY on mount & ResizeObserver (never per-frame)
 * to guarantee zero forced layout reflows during scroll scrubbing.
 */
function resizeCanvasBacking(
  canvas: HTMLCanvasElement,
  cssW: number,
  cssH: number,
  mobile: boolean
): { backingScale: number; resized: boolean } {
  if (cssW <= 0 || cssH <= 0) {
    return { backingScale: 1, resized: false };
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
  return { backingScale: canvas.height / cssH, resized };
}

function makeCubicFeather(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number
): CanvasGradient {
  const grad = ctx.createLinearGradient(x0, y0, x1, y1);
  grad.addColorStop(0, "#000000");
  grad.addColorStop(0.28, "rgba(0, 0, 0, 0.78)");
  grad.addColorStop(0.58, "rgba(0, 0, 0, 0.34)");
  grad.addColorStop(0.82, "rgba(0, 0, 0, 0.08)");
  grad.addColorStop(1, "rgba(0, 0, 0, 0)");
  return grad;
}

function getOrBuildFeather(
  ctx: CanvasRenderingContext2D,
  rect: Maru60CinemaDrawRect,
  cache: { current: CachedFeather | null }
): CachedFeather {
  const key = `${Math.round(rect.dx)}:${Math.round(rect.dy)}:${Math.round(rect.dw)}:${Math.round(rect.dh)}`;
  if (cache.current?.key === key) {
    return cache.current;
  }
  const topBand = rect.dh * 0.22;
  const botBand = rect.dh * 0.28;
  const sideBand = rect.dw * 0.24;
  const botY = rect.dy + rect.dh - botBand;
  const built: CachedFeather = {
    bot: makeCubicFeather(ctx, 0, rect.dy + rect.dh, 0, botY),
    botY,
    dh: rect.dh,
    dw: rect.dw,
    dx: rect.dx,
    dy: rect.dy,
    key,
    left:
      rect.dx > 1
        ? makeCubicFeather(ctx, rect.dx, 0, rect.dx + sideBand, 0)
        : null,
    right:
      rect.dx > 1
        ? makeCubicFeather(
            ctx,
            rect.dx + rect.dw,
            0,
            rect.dx + rect.dw - sideBand,
            0
          )
        : null,
    sideBand,
    top: makeCubicFeather(ctx, 0, rect.dy, 0, rect.dy + topBand),
    topBand,
  };
  cache.current = built;
  return built;
}

function drawFrameToCanvas(
  canvas: HTMLCanvasElement,
  frame: CinemaFrameSource,
  frameIndex: number,
  backingScale: number,
  featherCache: { current: CachedFeather | null }
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
  const rect = computeMaru60CinemaRect(
    width,
    height,
    sourceW,
    sourceH,
    frameIndex,
    backingScale
  );

  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, width, height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(frame, rect.dx, rect.dy, rect.dw, rect.dh);

  if (rect.featherEdges) {
    const f = getOrBuildFeather(ctx, rect, featherCache);
    ctx.save();
    ctx.globalAlpha = rect.featherAlpha;
    ctx.fillStyle = f.top;
    ctx.fillRect(f.dx - 1, f.dy - 1, f.dw + 2, f.topBand + 2);
    ctx.fillStyle = f.bot;
    ctx.fillRect(f.dx - 1, f.botY, f.dw + 2, f.dy + f.dh - f.botY + 2);
    if (f.left && f.right) {
      ctx.fillStyle = f.left;
      ctx.fillRect(f.dx - 1, f.dy - 1, f.sideBand + 2, f.dh + 2);
      ctx.fillStyle = f.right;
      ctx.fillRect(
        f.dx + f.dw - f.sideBand,
        f.dy - 1,
        f.sideBand + 2,
        f.dh + 2
      );
    }
    ctx.restore();
  }
  return true;
}

export function getRunwayScrollProgress(runwayEl: HTMLElement): number {
  const rect = runwayEl.getBoundingClientRect();
  const viewportH = window.innerHeight || 1;
  const scrollable = rect.height - viewportH;
  if (scrollable <= 0) {
    return 0;
  }
  return clamp(-rect.top / scrollable, 0, 1);
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

function yieldToMainThread(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 16);
  });
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

function getVersionedFrameSrc(index: number): string {
  return `${getMaru60CinemaFrameSrc(index)}?v=${MARU60_SCROLL_SEQUENCE.version}`;
}

/**
 * Deduplicates and caches compressed WebP blobs (~55 KB each) so mobile scrub
 * decodes, offscreen re-entries, and 160ms full-res idle settle never trigger
 * duplicate network fetches for the same frame.
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

export function Maru60ScrollCinema() {
  const t = useTranslations("products.maru60Cinema");
  const runwayRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progressBarRef = useRef<HTMLSpanElement>(null);
  const featherCacheRef = useRef<CachedFeather | null>(null);
  const framesRef = useRef<(CinemaFrameSource | null)[]>(
    Array.from({ length: TOTAL_FRAMES }, () => null)
  );
  const blobCacheRef = useRef<Map<number, Blob>>(new Map());
  const blobInFlightRef = useRef<Map<number, Promise<Blob | null>>>(new Map());
  const mobileRef = useRef<boolean>(false);
  const inViewRef = useRef<boolean>(false);
  const backingScaleRef = useRef<number>(1);
  const currentFrameRef = useRef(0);
  const drawnSourceIndexRef = useRef(-1);
  const refinedFrameRef = useRef(-1);
  const scheduleRefineRef = useRef<((index: number) => void) | null>(null);
  const [engaged, setEngaged] = useState(false);
  const [inView, setInView] = useState(false);
  const [compactMobile, setCompactMobile] = useState(false);
  const [activeBeat, setActiveBeat] = useState<Maru60CinemaBeat>(() =>
    getMaru60CinemaBeat(0)
  );
  const [canvasReady, setCanvasReady] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const releaseAllMobileBitmaps = useCallback(() => {
    const store = framesRef.current;
    for (let i = 0; i < store.length; i += 1) {
      const item = store[i];
      if (isImageBitmapSource(item)) {
        item.close();
        store[i] = null;
      }
    }
    drawnSourceIndexRef.current = -1;
    refinedFrameRef.current = -1;
  }, []);

  const paintFrame = useCallback((frameProgress: number): boolean => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return false;
    }
    const clamped = clamp(Math.round(frameProgress), 0, TOTAL_FRAMES - 1);
    const found = findNearestLoadedFrame(
      framesRef.current,
      clamped,
      isLoadedFrame
    );
    if (!found) {
      return false;
    }
    const painted = drawFrameToCanvas(
      canvas,
      found.frame,
      clamped,
      backingScaleRef.current,
      featherCacheRef
    );
    if (!painted) {
      return false;
    }
    drawnSourceIndexRef.current = found.index;
    setCanvasReady((ready) => (ready ? ready : true));
    return true;
  }, []);

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
        releaseAllMobileBitmaps();
        setCanvasReady(false);
        setActiveBeat(getMaru60CinemaBeat(REDUCED_MOTION_HERO_FRAME));
      }
    };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, [releaseAllMobileBitmaps]);

  // Gate GSAP download and 120-frame WebP preloading until the visitor scrolls
  // into the cinema, and release mobile GPU bitmaps when scrolled offscreen.
  useEffect(() => {
    if (reducedMotion) {
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
          const wanted = clamp(
            Math.round(currentFrameRef.current),
            0,
            TOTAL_FRAMES - 1
          );
          scheduleRefineRef.current?.(wanted);
        } else {
          inViewRef.current = false;
          setInView(false);
          if (mobileRef.current && offscreenTimer === null) {
            offscreenTimer = setTimeout(() => {
              offscreenTimer = null;
              if (!inViewRef.current && mobileRef.current) {
                releaseAllMobileBitmaps();
              }
            }, MOBILE_OFFSCREEN_EVICT_MS);
          }
        }
      },
      { rootMargin: "0px 0px" }
    );
    io.observe(runwayEl);
    return () => {
      io.disconnect();
      if (offscreenTimer !== null) {
        clearTimeout(offscreenTimer);
      }
    };
  }, [reducedMotion, releaseAllMobileBitmaps]);

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
        getSourceDimensions(existing).width >= MARU60_SCROLL_SEQUENCE.width
      ) {
        repaintIfCloser(index);
        return;
      }
      const frame = await loadHtmlImage(getVersionedFrameSrc(index));
      if (!frame) {
        return;
      }
      if (cancelled) {
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
      if (cancelled || !inViewRef.current) {
        return;
      }
      if (!decodeNow) {
        // Warm compressed WebP blob (~55 KB) only so scrubbing never stalls on network,
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
        store as (ImageBitmap | null)[],
        anchor,
        drawnSourceIndexRef.current,
        MOBILE_MAX_DECODED_BITMAPS,
        isImageBitmapSource
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

      // Mobile: decode only the start frame + nearest keyframes if budget has headroom
      // (avoiding redundant decode-then-evict churn on quick <450ms offscreen bounces),
      // and warm remaining scrub frames as lightweight compressed Blobs (~3.5 MiB total).
      await loadMobileIndex(start, true);
      scheduleRefineRef.current?.(start);
      const headroom = Math.max(
        0,
        MOBILE_MAX_DECODED_BITMAPS - 2 - countActiveMobileBitmaps(store)
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

  // Always release any live ImageBitmaps on unmount.
  useEffect(() => () => releaseAllMobileBitmaps(), [releaseAllMobileBitmaps]);

  // Lazily import GSAP + ScrollTrigger once engaged (skipped entirely under reduced-motion).
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
    let revertGsap: (() => void) | null = null;
    let refreshTrigger: (() => void) | null = null;
    let lastBeatId = getMaru60CinemaBeat(currentFrameRef.current).id;
    let lastDocHeight = document.documentElement.scrollHeight;
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
        store as (ImageBitmap | null)[],
        anchor,
        drawnSourceIndexRef.current,
        MOBILE_MAX_DECODED_BITMAPS,
        isImageBitmapSource
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
      // Skip if the exact cached frame is already full-resolution (e.g. resized desktop -> mobile).
      const exactCached = framesRef.current[wantedIndex];
      if (
        isLoadedFrame(exactCached) &&
        getSourceDimensions(exactCached).width >= MARU60_SCROLL_SEQUENCE.width
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
              if (
                cancelled ||
                !inViewRef.current ||
                !mobileRef.current ||
                token !== refineToken ||
                clamp(
                  Math.round(currentFrameRef.current),
                  0,
                  TOTAL_FRAMES - 1
                ) !== wantedIndex
              ) {
                return;
              }
              const painted = drawFrameToCanvas(
                canvasEl,
                bitmap,
                wantedIndex,
                backingScaleRef.current,
                featherCacheRef
              );
              if (!painted) {
                return;
              }
              drawnSourceIndexRef.current = wantedIndex;
              refinedFrameRef.current = wantedIndex;
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

    const syncUi = (frameValue: number, progress: number) => {
      currentFrameRef.current = frameValue;
      const wantedIndex = clamp(Math.round(frameValue), 0, TOTAL_FRAMES - 1);

      const holdingRefinedPaint =
        refinedFrameRef.current === wantedIndex &&
        drawnSourceIndexRef.current === wantedIndex;

      if (!holdingRefinedPaint) {
        if (wantedIndex !== refinedFrameRef.current) {
          refinedFrameRef.current = -1;
        }
        const found = findNearestLoadedFrame(
          framesRef.current,
          wantedIndex,
          isLoadedFrame
        );
        if (found && found.index !== drawnSourceIndexRef.current) {
          paintFrame(wantedIndex);
        }
        ensureMobileWindow(wantedIndex);
        scheduleMobileRefine(wantedIndex);
      }

      if (progressBarRef.current) {
        progressBarRef.current.style.transform = `scaleX(${clamp(progress, 0, 1)})`;
      }

      const nextBeat = getMaru60CinemaBeat(wantedIndex);
      if (nextBeat.id !== lastBeatId) {
        lastBeatId = nextBeat.id;
        setActiveBeat(nextBeat);
      }
    };

    const syncCanvasSize = () => {
      const rect = canvasEl.getBoundingClientRect();
      const prevMobile = mobileRef.current;
      const nextMobile = isCompactMobileViewport();
      mobileRef.current = nextMobile;
      setCompactMobile(nextMobile);
      const { backingScale, resized } = resizeCanvasBacking(
        canvasEl,
        rect.width,
        rect.height,
        nextMobile
      );
      backingScaleRef.current = backingScale;
      const widenedToDesktop = prevMobile && !nextMobile;
      if (widenedToDesktop) {
        cancelRefine();
        releaseAllMobileBitmaps();
      }
      if (resized || widenedToDesktop || drawnSourceIndexRef.current === -1) {
        featherCacheRef.current = null;
        refinedFrameRef.current = -1;
        paintFrame(currentFrameRef.current);
        const wantedIndex = clamp(
          Math.round(currentFrameRef.current),
          0,
          TOTAL_FRAMES - 1
        );
        ensureMobileWindow(wantedIndex);
        scheduleMobileRefine(wantedIndex);
      }
    };

    const initialProgress = getRunwayScrollProgress(runwayEl);
    currentFrameRef.current = initialProgress * (TOTAL_FRAMES - 1);
    syncCanvasSize();
    syncUi(currentFrameRef.current, initialProgress);

    const mountGsap = async () => {
      const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (cancelled) {
        return;
      }

      if (!scrollTriggerRegistered) {
        gsap.registerPlugin(ScrollTrigger);
        ScrollTrigger.config({ ignoreMobileResize: true });
        scrollTriggerRegistered = true;
      }

      // Always map [0 -> TOTAL_FRAMES - 1] cleanly so re-running the effect at
      // mid-scroll never shrinks the tween range.
      const playhead = { frame: 0 };
      const scrubSetting: boolean | number = isCompactMobileViewport()
        ? true
        : 0.16;

      const ctx = gsap.context(() => {
        const tween = gsap.to(playhead, {
          ease: "none",
          frame: TOTAL_FRAMES - 1,
          onUpdate: () => {
            const progress = playhead.frame / Math.max(1, TOTAL_FRAMES - 1);
            syncUi(playhead.frame, progress);
          },
          scrollTrigger: {
            end: "bottom bottom",
            invalidateOnRefresh: true,
            onRefresh: (self) => {
              syncUi(self.progress * (TOTAL_FRAMES - 1), self.progress);
            },
            scrub: scrubSetting,
            start: "top top",
            trigger: runwayEl,
          },
        });
        // Snap tween & UI immediately to the live scroll position on mid-page
        // reload or fast jump instead of waiting for a manual scroll tick.
        const liveProgress = getRunwayScrollProgress(runwayEl);
        if (liveProgress > 0) {
          tween.progress(liveProgress);
          syncUi(liveProgress * (TOTAL_FRAMES - 1), liveProgress);
        }
      }, runwayEl);

      ScrollTrigger.refresh();

      revertGsap = () => ctx.revert();
      refreshTrigger = () => ScrollTrigger.refresh();
    };

    mountGsap();

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        const wantedIndex = clamp(
          Math.round(currentFrameRef.current),
          0,
          TOTAL_FRAMES - 1
        );
        refinedFrameRef.current = -1;
        paintFrame(currentFrameRef.current);
        ensureMobileWindow(wantedIndex);
        scheduleMobileRefine(wantedIndex);
      }
    };

    const onPageShow = () => {
      syncCanvasSize();
      const progress = getRunwayScrollProgress(runwayEl);
      syncUi(progress * (TOTAL_FRAMES - 1), progress);
      refreshTrigger?.();
    };

    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver((entries) => {
            let canvasResized = false;
            for (const entry of entries) {
              if (entry.target === canvasEl) {
                canvasResized = true;
              }
            }
            if (canvasResized) {
              syncCanvasSize();
            }
            const nextDocHeight = document.documentElement.scrollHeight;
            if (canvasResized || nextDocHeight !== lastDocHeight) {
              lastDocHeight = nextDocHeight;
              refreshTrigger?.();
            }
          });
    resizeObserver?.observe(canvasEl);
    resizeObserver?.observe(document.body);

    const fontsReady = document.fonts?.ready;
    if (fontsReady) {
      fontsReady.then(() => {
        if (!cancelled) {
          refreshTrigger?.();
        }
      });
    }

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pageshow", onPageShow);

    return () => {
      cancelled = true;
      scheduleRefineRef.current = null;
      cancelRefine();
      revertGsap?.();
      resizeObserver?.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [engaged, paintFrame, reducedMotion, releaseAllMobileBitmaps]);

  const posterIndex = reducedMotion ? REDUCED_MOTION_HERO_FRAME : 0;
  const posterSrc = getVersionedFrameSrc(posterIndex);

  return (
    <section
      aria-label={t("label")}
      className="store-maru-cinema-runway"
      data-act={activeBeat.act}
      data-beat={activeBeat.id}
      data-reduced-motion={reducedMotion}
      data-testid="maru60-scroll-cinema"
      ref={runwayRef}
    >
      <div className="store-maru-cinema-sticky">
        <div className="store-maru-cinema-stage">
          {/* Lazy first-paint poster underneath canvas (and static hero under reduced-motion). */}
          <Image
            alt=""
            aria-hidden="true"
            className="store-maru-cinema-poster"
            data-hidden={!reducedMotion && canvasReady}
            decoding="async"
            height={MARU60_SCROLL_SEQUENCE.height}
            loading="lazy"
            src={posterSrc}
            unoptimized
            width={MARU60_SCROLL_SEQUENCE.width}
          />
          {reducedMotion ? null : (
            <>
              <canvas
                className="store-maru-cinema-canvas"
                height={MARU60_SCROLL_SEQUENCE.height}
                inert
                ref={canvasRef}
                width={MARU60_SCROLL_SEQUENCE.width}
              />

              <div aria-hidden="true" className="store-maru-cinema-hud">
                <span className="store-maru-cinema-progress-track">
                  <span
                    className="store-maru-cinema-progress-fill"
                    ref={progressBarRef}
                  />
                </span>
              </div>
            </>
          )}

          <div className="store-maru-cinema-caption" data-beat={activeBeat.id}>
            <p className="store-maru-cinema-title" key={activeBeat.id}>
              {t(`beats.${activeBeat.id}`)}
            </p>
            {!reducedMotion && activeBeat.lineupIndex !== undefined ? (
              <div
                aria-hidden="true"
                className="store-maru-cinema-pips"
                data-testid="maru60-cinema-pips"
              >
                {LINEUP_SLOTS.map((slot) => (
                  <span
                    className="store-maru-cinema-pip"
                    data-active={slot === activeBeat.lineupIndex}
                    key={slot}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
