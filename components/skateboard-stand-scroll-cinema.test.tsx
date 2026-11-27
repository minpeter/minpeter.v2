// @vitest-environment jsdom
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import type { AbstractIntlMessages } from "next-intl";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";
import en from "@/shared/i18n/en.json";
import { STAND_SCROLL_SEQUENCE } from "@/shared/skateboard-stand";

import {
  buildPriorityLoadOrder,
  computeCinemaDrawRect,
  evictBitmapsToBudget,
  findNearestLoadedFrame,
  getCinemaSafeHeight,
  getCinemaSafeWidth,
  getRunwayScrollProgress,
  isCompactMobileViewport,
  MOBILE_MAX_DECODED_BITMAPS,
  SkateboardStandScrollCinema,
} from "./skateboard-stand-scroll-cinema";

const SRC_W = 2560;
const SRC_H = 1440;

const MESSAGES = {
  products: {
    standCustomization: en.products.standCustomization,
  },
} as unknown as AbstractIntlMessages;

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  cleanup();
});

describe("SkateboardStandScrollCinema adaptive framing", () => {
  it("keeps standard 16:9 and 16:10 desktop viewports at exact full-bleed cover scale for every frame", () => {
    for (const [vw, vh] of [
      [1280, 800],
      [1440, 900],
      [1920, 1080],
    ] as const) {
      const coverScale = Math.max(vw / SRC_W, vh / SRC_H);
      for (let f = 0; f < 60; f += 1) {
        const rect = computeCinemaDrawRect(vw, vh, SRC_W, SRC_H, f);
        expect(rect.scale).toBeCloseTo(coverScale, 6);
        expect(rect.dw).toBeGreaterThanOrEqual(vw - 0.01);
        expect(rect.dh).toBeGreaterThanOrEqual(vh - 0.01);
      }
    }
  });

  it("prevents vertical board clipping on ultrawide and short desktop viewports (21:9, 32:9, half-height)", () => {
    for (const [vw, vh] of [
      [2560, 1080],
      [2560, 720],
      [1440, 560],
      [1366, 657],
      [852, 393],
    ] as const) {
      // Solo stand on F00–F07 spans y in [325..1149]; must stay completely visible.
      const f0 = computeCinemaDrawRect(vw, vh, SRC_W, SRC_H, 0);
      const topSrc0 = -f0.dy / f0.scale;
      const bottomSrc0 = (vh - f0.dy) / f0.scale;
      expect(topSrc0).toBeLessThan(325);
      expect(bottomSrc0).toBeGreaterThan(1149);

      // Upright docked board on F10–F59 spans full y in [0..1440]; must never crop vertically.
      for (let f = 10; f < 60; f += 1) {
        const rect = computeCinemaDrawRect(vw, vh, SRC_W, SRC_H, f);
        expect(rect.dh).toBeCloseTo(vh, 1);
        expect(rect.dy).toBeCloseTo(0, 1);
      }
    }
  });

  it("fits the wide solo stand cleanly inside portrait mobile and narrow desktop split windows during Act I", () => {
    for (const [vw, vh] of [
      [1024, 768],
      [900, 900],
      [780, 1040],
      [390, 844],
      [375, 667],
    ] as const) {
      // Widest Act I stand bounds: x in [417..2160].
      const f0 = computeCinemaDrawRect(vw, vh, SRC_W, SRC_H, 0);
      const visibleLeftSrc = -f0.dx / f0.scale;
      const visibleRightSrc = (vw - f0.dx) / f0.scale;
      expect(visibleLeftSrc).toBeLessThan(417);
      expect(visibleRightSrc).toBeGreaterThan(2160);
    }
  });

  it("transitions smoothly into full-height vertical framing once the upright board docks (F14–F59)", () => {
    const vw = 390;
    const vh = 844;
    const coverScale = vh / SRC_H;

    let prevWidth = getCinemaSafeWidth(0);
    let prevHeight = getCinemaSafeHeight(0);
    for (let f = 1; f < 60; f += 1) {
      const nextWidth = getCinemaSafeWidth(f);
      const nextHeight = getCinemaSafeHeight(f);
      expect(nextWidth).toBeLessThanOrEqual(prevWidth);
      expect(nextHeight).toBeGreaterThanOrEqual(prevHeight);
      prevWidth = nextWidth;
      prevHeight = nextHeight;
    }

    for (let f = 14; f < 60; f += 1) {
      const rect = computeCinemaDrawRect(vw, vh, SRC_W, SRC_H, f);
      expect(rect.scale).toBeCloseTo(coverScale, 6);
      expect(rect.dh).toBeCloseTo(vh, 1);
    }
  });

  it("reports the actual loaded frame index when falling back during progressive mobile loading", () => {
    const frames: (string | null)[] = Array.from({ length: 60 }, () => null);
    frames[0] = "f0";
    frames[8] = "f8";
    const isString = (v: string | null | undefined): v is string =>
      typeof v === "string";

    expect(findNearestLoadedFrame(frames, 5, isString)).toEqual({
      frame: "f8",
      index: 8,
    });
    expect(findNearestLoadedFrame(frames, 2, isString)).toEqual({
      frame: "f0",
      index: 0,
    });
    expect(findNearestLoadedFrame(frames, 8, isString)).toEqual({
      frame: "f8",
      index: 8,
    });
  });

  it("classifies short fine-pointer laptops as desktop and narrow or coarse-pointer screens as mobile", () => {
    const prevW = window.innerWidth;
    const prevH = window.innerHeight;
    const prevMatch = window.matchMedia;
    try {
      window.matchMedia = vi.fn().mockReturnValue({
        addEventListener: vi.fn(),
        matches: false,
        removeEventListener: vi.fn(),
      }) as unknown as typeof window.matchMedia;

      for (const [w, h] of [
        [1280, 690],
        [1366, 657],
        [1440, 760],
      ] as const) {
        Object.defineProperty(window, "innerWidth", {
          configurable: true,
          value: w,
        });
        Object.defineProperty(window, "innerHeight", {
          configurable: true,
          value: h,
        });
        expect(isCompactMobileViewport()).toBe(false);
      }

      Object.defineProperty(window, "innerWidth", {
        configurable: true,
        value: 390,
      });
      Object.defineProperty(window, "innerHeight", {
        configurable: true,
        value: 844,
      });
      expect(isCompactMobileViewport()).toBe(true);

      Object.defineProperty(window, "innerWidth", {
        configurable: true,
        value: 1024,
      });
      window.matchMedia = vi.fn().mockReturnValue({
        addEventListener: vi.fn(),
        matches: true,
        removeEventListener: vi.fn(),
      }) as unknown as typeof window.matchMedia;
      expect(isCompactMobileViewport()).toBe(true);
    } finally {
      Object.defineProperty(window, "innerWidth", {
        configurable: true,
        value: prevW,
      });
      Object.defineProperty(window, "innerHeight", {
        configurable: true,
        value: prevH,
      });
      window.matchMedia = prevMatch;
    }
  });

  it("evicts farthest bitmaps from the playhead while protecting active and drawn frames", () => {
    const closeSpy = vi.fn();
    const store: ({ close: () => void; id: number } | null)[] = Array.from(
      { length: 60 },
      (_, idx) => (idx % 2 === 0 ? { close: closeSpy, id: idx } : null)
    );
    const evicted = evictBitmapsToBudget(
      store,
      30,
      28,
      MOBILE_MAX_DECODED_BITMAPS,
      (item): item is { close: () => void; id: number } => item !== null
    );
    expect(evicted).toBe(30 - MOBILE_MAX_DECODED_BITMAPS);
    expect(closeSpy).toHaveBeenCalledTimes(evicted);
    expect(store.filter(Boolean)).toHaveLength(MOBILE_MAX_DECODED_BITMAPS);
    expect(store[30]).not.toBeNull();
    expect(store[28]).not.toBeNull();
    expect(store[0]).toBeNull();
    expect(store[58]).toBeNull();
  });

  it("builds mobile even-stepped load order around playhead and full 60-frame desktop order", () => {
    const mobileOrder = buildPriorityLoadOrder(30, true);
    const desktopOrder = buildPriorityLoadOrder(0, false);
    expect(mobileOrder.start).toBe(30);
    expect(
      1 + mobileOrder.keyframes.length + mobileOrder.rest.length
    ).toBeLessThanOrEqual(36);
    expect(1 + desktopOrder.keyframes.length + desktopOrder.rest.length).toBe(
      60
    );
  });

  it("computes normalized scroll progress accurately for mid-runway reloads", () => {
    const fakeEl = {
      getBoundingClientRect: () => ({ height: 3000, top: -1000 }),
    } as HTMLElement;
    const prevHeight = window.innerHeight;
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 1000,
    });
    expect(getRunwayScrollProgress(fakeEl)).toBeCloseTo(0.5, 5);
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: prevHeight,
    });
  });

  it("renders a static docked poster and skips canvas & preloading under prefers-reduced-motion", async () => {
    const prevMatch = window.matchMedia;
    const prevFetch = globalThis.fetch;
    const prevIO = globalThis.IntersectionObserver;
    const fetchSpy = vi.fn();
    const observeSpy = vi.fn();
    class MockIO {
      disconnect = vi.fn();
      observe = observeSpy;
    }
    globalThis.fetch = fetchSpy as unknown as typeof fetch;
    globalThis.IntersectionObserver =
      MockIO as unknown as typeof IntersectionObserver;
    window.matchMedia = vi.fn((query: string) => ({
      addEventListener: vi.fn(),
      matches: query === "(prefers-reduced-motion: reduce)",
      removeEventListener: vi.fn(),
    })) as unknown as typeof window.matchMedia;

    try {
      render(
        <NextIntlClientProvider locale="en" messages={MESSAGES}>
          <SkateboardStandScrollCinema />
        </NextIntlClientProvider>
      );

      const cinema = screen.getByTestId("stand-scroll-cinema");
      await waitFor(() => {
        expect(cinema.dataset.reducedMotion).toBe("true");
      });
      expect(cinema.dataset.frame).toBe(
        String(STAND_SCROLL_SEQUENCE.posterFrame)
      );
      // Avoid duplicate screen-reader announcement under reduced motion (poster img carries alt).
      expect(cinema.getAttribute("aria-label")).toBeNull();
      expect(cinema.querySelector("canvas")).toBeNull();
      const poster = cinema.querySelector("img.store-cinema-poster");
      expect(poster?.getAttribute("data-hidden")).toBe("false");
      expect(poster?.getAttribute("alt")).toBe(
        en.products.standCustomization.cinema.label
      );
      // IntersectionObserver must not attach on initial mount under reduced motion (prevents reload race).
      expect(observeSpy).not.toHaveBeenCalled();
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      window.matchMedia = prevMatch;
      globalThis.fetch = prevFetch;
      globalThis.IntersectionObserver = prevIO;
    }
  });

  it("stays idle before entering viewport, refines mobile at full QHD without duplicate fetches, evicts offscreen, and upgrades on desktop widen", async () => {
    class MockImageBitmap {
      close = vi.fn();
      height: number;
      width: number;
      constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
      }
    }

    let ioCallback:
      | ((entries: Partial<IntersectionObserverEntry>[]) => void)
      | null = null;
    let roCallback: ((entries: Partial<ResizeObserverEntry>[]) => void) | null =
      null;

    class MockIntersectionObserver {
      disconnect = vi.fn();
      observe = vi.fn();
      constructor(cb: (entries: Partial<IntersectionObserverEntry>[]) => void) {
        ioCallback = cb;
      }
    }

    class MockResizeObserver {
      disconnect = vi.fn();
      observe = vi.fn();
      constructor(cb: (entries: Partial<ResizeObserverEntry>[]) => void) {
        roCallback = cb;
      }
    }

    const prevW = window.innerWidth;
    const prevH = window.innerHeight;
    const prevMatch = window.matchMedia;
    const prevFetch = globalThis.fetch;
    const prevImageBitmap = globalThis.ImageBitmap;
    const prevCreateBitmap = globalThis.createImageBitmap;
    const prevIO = globalThis.IntersectionObserver;
    const prevRO = globalThis.ResizeObserver;
    const prevImage = window.Image;
    const prevRaf = window.requestAnimationFrame;

    const drawSizes: [number, number][] = [];
    const createdBitmaps: MockImageBitmap[] = [];
    const desktopLoadedUrls: string[] = [];
    let rafCalls = 0;

    class MockHtmlImage {
      complete = false;
      decoding = "async";
      naturalHeight = 0;
      naturalWidth = 0;
      onerror: (() => void) | null = null;
      onload: (() => void) | null = null;
      private _src = "";
      get src() {
        return this._src;
      }
      set src(value: string) {
        this._src = value;
        desktopLoadedUrls.push(value);
        this.complete = true;
        this.naturalWidth = 2560;
        this.naturalHeight = 1440;
        queueMicrotask(() => this.onload?.());
      }
    }

    const mockCtx = {
      createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
      drawImage: vi.fn(
        (source: {
          height?: number;
          naturalHeight?: number;
          naturalWidth?: number;
          width?: number;
        }) => {
          drawSizes.push([
            source.width ?? source.naturalWidth ?? 0,
            source.height ?? source.naturalHeight ?? 0,
          ]);
        }
      ),
      fillRect: vi.fn(),
      fillStyle: "#000000",
      imageSmoothingEnabled: true,
      imageSmoothingQuality: "high",
    };

    const getContextSpy = vi
      .spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockReturnValue(mockCtx as unknown as CanvasRenderingContext2D);
    let currentRect = { height: 667, width: 375 };
    vi.spyOn(
      HTMLCanvasElement.prototype,
      "getBoundingClientRect"
    ).mockImplementation(() => ({
      bottom: currentRect.height,
      height: currentRect.height,
      left: 0,
      right: currentRect.width,
      toJSON: () => ({}),
      top: 0,
      width: currentRect.width,
      x: 0,
      y: 0,
    }));

    const fetchSpy = vi.fn((_url: RequestInfo | URL) =>
      Promise.resolve({
        blob: () => Promise.resolve(new Blob(["webp"])),
        ok: true,
      })
    );

    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 375,
    });
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 667,
    });
    window.matchMedia = vi.fn(() => ({
      addEventListener: vi.fn(),
      matches: false,
      removeEventListener: vi.fn(),
    })) as unknown as typeof window.matchMedia;
    globalThis.fetch = fetchSpy as unknown as typeof fetch;
    globalThis.ImageBitmap = MockImageBitmap as unknown as typeof ImageBitmap;
    globalThis.createImageBitmap = vi.fn(
      (_blob: ImageBitmapSource, opts?: ImageBitmapOptions) => {
        const bm = new MockImageBitmap(
          opts?.resizeWidth ?? 2560,
          opts?.resizeHeight ?? 1440
        );
        createdBitmaps.push(bm);
        return Promise.resolve(bm as unknown as ImageBitmap);
      }
    ) as unknown as typeof createImageBitmap;
    globalThis.IntersectionObserver =
      MockIntersectionObserver as unknown as typeof IntersectionObserver;
    globalThis.ResizeObserver =
      MockResizeObserver as unknown as typeof ResizeObserver;
    window.Image = MockHtmlImage as unknown as typeof window.Image;
    window.requestAnimationFrame = vi.fn((cb: FrameRequestCallback) => {
      rafCalls += 1;
      return prevRaf(cb);
    });

    try {
      render(
        <NextIntlClientProvider locale="en" messages={MESSAGES}>
          <SkateboardStandScrollCinema />
        </NextIntlClientProvider>
      );

      const cinema = screen.getByTestId("stand-scroll-cinema");
      const canvas = cinema.querySelector("canvas.store-cinema-canvas");
      expect(canvas).toBeTruthy();
      expect(canvas?.hasAttribute("inert")).toBe(true);
      expect(canvas?.getAttribute("role")).toBeNull();
      expect(canvas?.getAttribute("aria-label")).toBeNull();
      // Lazy engagement: zero poster img, zero fetches, and zero rAF calls while offscreen at top of page.
      expect(cinema.querySelector("img.store-cinema-poster")).toBeNull();
      expect(fetchSpy).not.toHaveBeenCalled();
      expect(rafCalls).toBe(0);

      // Enter viewport on mobile (375×667) -> settles at full QHD (2560×1440) and closes temporary bitmap.
      act(() => {
        ioCallback?.([{ isIntersecting: true }]);
      });
      await waitFor(() => {
        expect(drawSizes.some(([w, h]) => w === 2560 && h === 1440)).toBe(true);
      });
      const fullResBitmaps = createdBitmaps.filter(
        (b) => b.width === 2560 && b.height === 1440
      );
      expect(fullResBitmaps.length).toBeGreaterThanOrEqual(1);
      for (const bm of fullResBitmaps) {
        expect(bm.close).toHaveBeenCalledTimes(1);
      }
      const f0Fetches = fetchSpy.mock.calls.filter(([url]) =>
        String(url).includes("/frame_000.webp")
      );
      expect(f0Fetches).toHaveLength(1);
      // Zero idle rAF polling while settled.
      expect(rafCalls).toBe(0);

      // Scroll offscreen >450ms -> closes every live mobile bitmap.
      act(() => {
        ioCallback?.([{ isIntersecting: false }]);
      });
      await new Promise((r) => setTimeout(r, 520));
      for (const bm of createdBitmaps) {
        expect(bm.close).toHaveBeenCalled();
      }

      // Re-enter and widen to 1366×657 desktop -> upgrades to desktop HTMLImageElement loading.
      act(() => {
        ioCallback?.([{ isIntersecting: true }]);
      });
      Object.defineProperty(window, "innerWidth", {
        configurable: true,
        value: 1366,
      });
      Object.defineProperty(window, "innerHeight", {
        configurable: true,
        value: 657,
      });
      currentRect = { height: 657, width: 1366 };
      act(() => {
        roCallback?.([{ target: canvas as HTMLCanvasElement }]);
      });
      await waitFor(() => {
        expect(desktopLoadedUrls.length).toBeGreaterThan(0);
      });

      // Null 2D context keeps poster visible instead of painting black.
      cleanup();
      getContextSpy.mockReturnValue(null);
      render(
        <NextIntlClientProvider locale="en" messages={MESSAGES}>
          <SkateboardStandScrollCinema />
        </NextIntlClientProvider>
      );
      act(() => {
        ioCallback?.([{ isIntersecting: true }]);
      });
      expect(
        screen
          .getByTestId("stand-scroll-cinema")
          .querySelector("img.store-cinema-poster")
          ?.getAttribute("data-hidden")
      ).toBe("false");
    } finally {
      Object.defineProperty(window, "innerWidth", {
        configurable: true,
        value: prevW,
      });
      Object.defineProperty(window, "innerHeight", {
        configurable: true,
        value: prevH,
      });
      window.matchMedia = prevMatch;
      globalThis.fetch = prevFetch;
      globalThis.ImageBitmap = prevImageBitmap;
      globalThis.createImageBitmap = prevCreateBitmap;
      globalThis.IntersectionObserver = prevIO;
      globalThis.ResizeObserver = prevRO;
      window.Image = prevImage;
      window.requestAnimationFrame = prevRaf;
    }
  });

  it("enforces mobile budget and offscreen eviction for HTMLImageElement fallbacks, and keeps canvas painted across desktop-to-mobile tier resize", async () => {
    let ioCallback:
      | ((entries: Partial<IntersectionObserverEntry>[]) => void)
      | null = null;
    let roCallback: ((entries: Partial<ResizeObserverEntry>[]) => void) | null =
      null;

    class MockIntersectionObserver {
      disconnect = vi.fn();
      observe = vi.fn();
      constructor(cb: (entries: Partial<IntersectionObserverEntry>[]) => void) {
        ioCallback = cb;
      }
    }

    class MockResizeObserver {
      disconnect = vi.fn();
      observe = vi.fn();
      constructor(cb: (entries: Partial<ResizeObserverEntry>[]) => void) {
        roCallback = cb;
      }
    }

    const prevW = window.innerWidth;
    const prevH = window.innerHeight;
    const prevMatch = window.matchMedia;
    const prevFetch = globalThis.fetch;
    const prevCreateBitmap = globalThis.createImageBitmap;
    const prevIO = globalThis.IntersectionObserver;
    const prevRO = globalThis.ResizeObserver;
    const prevImage = window.Image;

    let imageInstances = 0;
    const drawnSources: unknown[] = [];

    class MockHtmlImage {
      complete = false;
      decoding = "async";
      naturalHeight = 0;
      naturalWidth = 0;
      onerror: (() => void) | null = null;
      onload: (() => void) | null = null;
      private _src = "";
      get src() {
        return this._src;
      }
      set src(value: string) {
        this._src = value;
        imageInstances += 1;
        this.complete = true;
        this.naturalWidth = 2560;
        this.naturalHeight = 1440;
        queueMicrotask(() => this.onload?.());
      }
    }

    const mockCtx = {
      createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
      drawImage: vi.fn((source: unknown) => {
        drawnSources.push(source);
      }),
      fillRect: vi.fn(),
      fillStyle: "#000000",
      imageSmoothingEnabled: true,
      imageSmoothingQuality: "high",
    };

    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      mockCtx as unknown as CanvasRenderingContext2D
    );
    let currentRect = { height: 568, width: 320 };
    vi.spyOn(
      HTMLCanvasElement.prototype,
      "getBoundingClientRect"
    ).mockImplementation(() => ({
      bottom: currentRect.height,
      height: currentRect.height,
      left: 0,
      right: currentRect.width,
      toJSON: () => ({}),
      top: 0,
      width: currentRect.width,
      x: 0,
      y: 0,
    }));

    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 320,
    });
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 568,
    });
    window.matchMedia = vi.fn(() => ({
      addEventListener: vi.fn(),
      matches: false,
      removeEventListener: vi.fn(),
    })) as unknown as typeof window.matchMedia;
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        blob: () => Promise.resolve(new Blob(["webp"])),
        ok: true,
      })
    ) as unknown as typeof fetch;
    // Force createImageBitmap failure so mobile falls back to HTMLImageElement.
    globalThis.createImageBitmap = vi.fn(() =>
      Promise.reject(new Error("resize unsupported"))
    ) as unknown as typeof createImageBitmap;
    globalThis.IntersectionObserver =
      MockIntersectionObserver as unknown as typeof IntersectionObserver;
    globalThis.ResizeObserver =
      MockResizeObserver as unknown as typeof ResizeObserver;
    window.Image = MockHtmlImage as unknown as typeof window.Image;

    try {
      // 1. Mobile fallback path: evicts HTMLImageElement entries offscreen so re-entry reloads fresh images.
      render(
        <NextIntlClientProvider locale="en" messages={MESSAGES}>
          <SkateboardStandScrollCinema />
        </NextIntlClientProvider>
      );
      act(() => {
        ioCallback?.([{ isIntersecting: true }]);
      });
      await waitFor(() => {
        expect(drawnSources.length).toBeGreaterThan(0);
      });
      // Budget caps initial mobile fallback decodes to <= MOBILE_MAX_DECODED_BITMAPS.
      expect(imageInstances).toBeLessThanOrEqual(MOBILE_MAX_DECODED_BITMAPS);

      act(() => {
        ioCallback?.([{ isIntersecting: false }]);
      });
      await new Promise((r) => setTimeout(r, 520));
      const countBeforeReEntry = imageInstances;
      act(() => {
        ioCallback?.([{ isIntersecting: true }]);
      });
      await waitFor(() => {
        expect(imageInstances).toBeGreaterThan(countBeforeReEntry);
      });

      // 2. Desktop -> mobile tier change with delayed mobile decode keeps canvas painted (never blanks).
      cleanup();
      drawnSources.length = 0;
      Object.defineProperty(window, "innerWidth", {
        configurable: true,
        value: 1280,
      });
      Object.defineProperty(window, "innerHeight", {
        configurable: true,
        value: 690,
      });
      currentRect = { height: 690, width: 1280 };
      const neverResolvingBitmap = new Promise<ImageBitmap>(() => undefined);
      globalThis.createImageBitmap = vi.fn(
        () => neverResolvingBitmap
      ) as unknown as typeof createImageBitmap;

      render(
        <NextIntlClientProvider locale="en" messages={MESSAGES}>
          <SkateboardStandScrollCinema />
        </NextIntlClientProvider>
      );
      act(() => {
        ioCallback?.([{ isIntersecting: true }]);
      });
      await waitFor(() => {
        expect(drawnSources.length).toBeGreaterThan(0);
      });
      const drawsBeforeResize = drawnSources.length;

      Object.defineProperty(window, "innerWidth", {
        configurable: true,
        value: 390,
      });
      Object.defineProperty(window, "innerHeight", {
        configurable: true,
        value: 740,
      });
      currentRect = { height: 740, width: 390 };
      const canvasEl = screen
        .getByTestId("stand-scroll-cinema")
        .querySelector("canvas") as HTMLCanvasElement;
      act(() => {
        roCallback?.([{ target: canvasEl }]);
      });
      // Existing frame is repainted onto the newly resized canvas before outgoing frames clear.
      expect(drawnSources.length).toBeGreaterThan(drawsBeforeResize);
      expect(canvasEl.dataset.ready).toBe("true");

      // A second consecutive resize while incoming frames (and poster) are still stalled
      // repaints from the preserved single bridge frame instead of flashing black.
      const drawsAfterFirstResize = drawnSources.length;
      currentRect = { height: 700, width: 390 };
      act(() => {
        roCallback?.([{ target: canvasEl }]);
      });
      expect(drawnSources.length).toBeGreaterThan(drawsAfterFirstResize);
      expect(canvasEl.dataset.ready).toBe("true");

      // After offscreen eviction clears all frames including the bridge frame, a resize
      // cleanly falls back to the instant-reveal poster (and an offscreen tier change creates no bridge).
      act(() => {
        ioCallback?.([{ isIntersecting: false }]);
      });
      await new Promise((r) => setTimeout(r, 520));
      Object.defineProperty(window, "innerWidth", {
        configurable: true,
        value: 1280,
      });
      Object.defineProperty(window, "innerHeight", {
        configurable: true,
        value: 690,
      });
      currentRect = { height: 690, width: 1280 };
      act(() => {
        roCallback?.([{ target: canvasEl }]);
      });
      expect(canvasEl.dataset.ready).toBe("false");
      expect(
        screen
          .getByTestId("stand-scroll-cinema")
          .querySelector("img.store-cinema-poster")
          ?.getAttribute("data-hidden")
      ).toBe("false");
    } finally {
      Object.defineProperty(window, "innerWidth", {
        configurable: true,
        value: prevW,
      });
      Object.defineProperty(window, "innerHeight", {
        configurable: true,
        value: prevH,
      });
      window.matchMedia = prevMatch;
      globalThis.fetch = prevFetch;
      globalThis.createImageBitmap = prevCreateBitmap;
      globalThis.IntersectionObserver = prevIO;
      globalThis.ResizeObserver = prevRO;
      window.Image = prevImage;
    }
  });
});
