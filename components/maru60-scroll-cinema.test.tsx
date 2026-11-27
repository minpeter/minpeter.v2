// @vitest-environment jsdom
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import type { AbstractIntlMessages } from "next-intl";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";
import en from "@/shared/i18n/en.json";
import {
  buildPriorityLoadOrder,
  computeMaru60CinemaRect,
  evictBitmapsToBudget,
  findNearestLoadedFrame,
  getRunwayScrollProgress,
  isCompactMobileViewport,
  Maru60ScrollCinema,
  MOBILE_MAX_DECODED_BITMAPS,
} from "./maru60-scroll-cinema";

const SRC_W = 1440;
const SRC_H = 1800;

interface CapturedTween {
  onUpdate?: () => void;
  scrollTrigger: { kill: ReturnType<typeof vi.fn>; progress: number };
  target: { frame: number };
}

let capturedTween: CapturedTween | null = null;

vi.mock("gsap", () => {
  const to = vi.fn(
    (target: { frame: number }, vars: { onUpdate?: () => void }) => {
      const scrollTrigger = { kill: vi.fn(), progress: 0 };
      capturedTween = {
        onUpdate: vars.onUpdate,
        scrollTrigger,
        target,
      };
      // Mirror real GSAP ScrollTrigger behavior: initial refresh invokes onUpdate synchronously
      // before `gsap.to(...)` returns, catching any temporal dead zone (TDZ) bugs in tests.
      vars.onUpdate?.();
      return { kill: vi.fn(), progress: vi.fn(), scrollTrigger };
    }
  );
  const context = vi.fn((fn: () => void) => {
    fn();
    return { revert: vi.fn() };
  });
  return {
    default: {
      context,
      registerPlugin: vi.fn(),
      to,
    },
  };
});

vi.mock("gsap/ScrollTrigger", () => ({
  ScrollTrigger: {
    config: vi.fn(),
    refresh: vi.fn(),
  },
}));

afterEach(() => {
  capturedTween = null;
  vi.useRealTimers();
  vi.restoreAllMocks();
  cleanup();
});

const MESSAGES = {
  products: {
    maru60Cinema: en.products.maru60Cinema,
  },
} as unknown as AbstractIntlMessages;

describe("Maru60ScrollCinema adaptive framing, fallback & GSAP scrub", () => {
  it("fits floating hardware inside HUD-free safe margins across ultrawide, short split, desktop, and mobile portrait", () => {
    for (const [vw, vh] of [
      [3440, 1440],
      [2560, 720],
      [1440, 560],
      [1440, 900],
      [1024, 768],
      [390, 844],
      [375, 667],
    ] as const) {
      for (const frameIndex of [0, 23, 44, 63]) {
        const rect = computeMaru60CinemaRect(vw, vh, SRC_W, SRC_H, frameIndex);
        expect(rect.featherEdges).toBe(false);
        expect(rect.featherAlpha).toBe(0);
        expect(rect.dx).toBeGreaterThanOrEqual(0);
        expect(rect.dx + rect.dw).toBeLessThanOrEqual(vw + 0.01);
        expect(rect.dy).toBeGreaterThanOrEqual(24 - 0.01);
        expect(rect.dy + rect.dh).toBeLessThanOrEqual(vh - 56 + 0.01);
      }
    }
  });

  it("smoothly interpolates framing and edge feathering across the Act II -> III arc dive with zero box jump", () => {
    let prevAlpha = 0;
    let prevScale = computeMaru60CinemaRect(1440, 900, SRC_W, SRC_H, 63).scale;
    for (let f = 64; f <= 70; f += 1) {
      const rect = computeMaru60CinemaRect(1440, 900, SRC_W, SRC_H, f);
      expect(rect.featherAlpha).toBeGreaterThan(prevAlpha);
      expect(rect.scale).toBeGreaterThanOrEqual(prevScale);
      prevAlpha = rect.featherAlpha;
      prevScale = rect.scale;
    }
    expect(prevAlpha).toBe(1);
  });

  it("enables seamless edge feathering without clipping vertically during full-bleed macro and radial acts", () => {
    for (const [vw, vh] of [
      [2560, 1080],
      [1440, 900],
      [390, 844],
    ] as const) {
      for (const frameIndex of [70, 88, 119]) {
        const rect = computeMaru60CinemaRect(vw, vh, SRC_W, SRC_H, frameIndex);
        expect(rect.featherEdges).toBe(true);
        expect(rect.featherAlpha).toBe(1);
        expect(rect.dh).toBeLessThanOrEqual(vh + 0.01);
        expect(rect.dw).toBeLessThanOrEqual(vw + 0.01);
      }
    }
  });

  it("classifies short desktop/laptop windows as desktop and narrow or coarse-pointer viewports as mobile", () => {
    const prevW = window.innerWidth;
    const prevH = window.innerHeight;
    const prevMatch = window.matchMedia;
    try {
      window.matchMedia = vi.fn().mockReturnValue({
        addEventListener: vi.fn(),
        matches: false,
        removeEventListener: vi.fn(),
      }) as unknown as typeof window.matchMedia;
      Object.defineProperty(window, "innerWidth", {
        configurable: true,
        value: 1280,
      });
      Object.defineProperty(window, "innerHeight", {
        configurable: true,
        value: 690,
      });
      expect(isCompactMobileViewport()).toBe(false);

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

  it("evicts farthest bitmaps from the playhead while protecting active and drawn indices", () => {
    const closeSpy = vi.fn();
    const store: ({ close: () => void; id: number } | null)[] = Array.from(
      { length: 120 },
      (_, idx) => (idx % 2 === 0 ? { close: closeSpy, id: idx } : null)
    );
    const evicted = evictBitmapsToBudget(
      store,
      60,
      58,
      MOBILE_MAX_DECODED_BITMAPS,
      (item): item is { close: () => void; id: number } => item !== null
    );
    expect(evicted).toBe(60 - MOBILE_MAX_DECODED_BITMAPS);
    expect(closeSpy).toHaveBeenCalledTimes(evicted);
    expect(store.filter(Boolean)).toHaveLength(MOBILE_MAX_DECODED_BITMAPS);
    expect(store[60]).not.toBeNull();
    expect(store[58]).not.toBeNull();
    expect(store[0]).toBeNull();
    expect(store[118]).toBeNull();
  });

  it("builds mobile even-stepped load order and full 120-frame desktop load order", () => {
    const mobileOrder = buildPriorityLoadOrder(0, true);
    const desktopOrder = buildPriorityLoadOrder(0, false);
    expect(
      1 + mobileOrder.keyframes.length + mobileOrder.rest.length
    ).toBeLessThan(70);
    expect(1 + desktopOrder.keyframes.length + desktopOrder.rest.length).toBe(
      120
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

  it("returns the nearest loaded frame index when scrubbing ahead of progressive decode", () => {
    const frames: (string | null)[] = Array.from({ length: 120 }, () => null);
    frames[0] = "f00";
    frames[15] = "f15";
    const isString = (value: string | null | undefined): value is string =>
      typeof value === "string";

    expect(findNearestLoadedFrame(frames, 12, isString)).toEqual({
      frame: "f15",
      index: 15,
    });
    expect(findNearestLoadedFrame(frames, 4, isString)).toEqual({
      frame: "f00",
      index: 0,
    });
    expect(findNearestLoadedFrame(frames, 15, isString)).toEqual({
      frame: "f15",
      index: 15,
    });
  });

  it("renders lazy poster fallback and updates beats & lineup pips after dynamic GSAP mount", async () => {
    render(
      <NextIntlClientProvider locale="en" messages={MESSAGES}>
        <Maru60ScrollCinema />
      </NextIntlClientProvider>
    );

    const cinema = screen.getByTestId("maru60-scroll-cinema");
    expect(cinema.dataset.act).toBe("profile");
    expect(cinema.dataset.beat).toBe("profileFront");
    expect(
      screen.getByText(en.products.maru60Cinema.beats.profileFront)
    ).toBeTruthy();
    expect(cinema.querySelector("img.store-maru-cinema-poster")).toBeTruthy();
    const canvas = cinema.querySelector("canvas.store-maru-cinema-canvas");
    expect(canvas).toBeTruthy();
    expect(canvas?.getAttribute("aria-label")).toBeNull();
    expect(canvas?.getAttribute("role")).toBeNull();
    // Ensure caption does not spam live-region announcements across 15 scroll beats.
    expect(
      cinema
        .querySelector(".store-maru-cinema-caption")
        ?.getAttribute("aria-live")
    ).toBeNull();

    // Wait for dynamic GSAP import to mount ScrollTrigger (jsdom has no IntersectionObserver -> engages immediately).
    await waitFor(() => {
      expect(capturedTween).not.toBeNull();
    });

    // Scrub into Act I brushed steel backplate beat
    act(() => {
      if (capturedTween) {
        capturedTween.target.frame = 22;
        capturedTween.scrollTrigger.progress = 22 / 119;
        capturedTween.onUpdate?.();
      }
    });
    expect(cinema.dataset.beat).toBe("profileBackplate");
    expect(
      screen.getByText(en.products.maru60Cinema.beats.profileBackplate)
    ).toBeTruthy();

    // Scrub into Act IV radial lineup (Ice Blue + Noel = slot 1, frames 92..95)
    act(() => {
      if (capturedTween) {
        capturedTween.target.frame = 93;
        capturedTween.scrollTrigger.progress = 93 / 119;
        capturedTween.onUpdate?.();
      }
    });
    expect(cinema.dataset.act).toBe("lineup");
    expect(cinema.dataset.beat).toBe("lineupIceBlue");
    const pips = screen
      .getByTestId("maru60-cinema-pips")
      .querySelectorAll(".store-maru-cinema-pip");
    expect(pips).toHaveLength(8);
    expect((pips[1] as HTMLElement).dataset.active).toBe("true");
  });

  it("renders a static compact showcase and skips GSAP under prefers-reduced-motion", async () => {
    const prevMatch = window.matchMedia;
    window.matchMedia = vi.fn((query: string) => ({
      addEventListener: vi.fn(),
      matches: query === "(prefers-reduced-motion: reduce)",
      removeEventListener: vi.fn(),
    })) as unknown as typeof window.matchMedia;

    try {
      render(
        <NextIntlClientProvider locale="en" messages={MESSAGES}>
          <Maru60ScrollCinema />
        </NextIntlClientProvider>
      );

      const cinema = screen.getByTestId("maru60-scroll-cinema");
      await waitFor(() => {
        expect(cinema.dataset.reducedMotion).toBe("true");
      });
      expect(cinema.querySelector("canvas")).toBeNull();
      expect(
        cinema
          .querySelector("img.store-maru-cinema-poster")
          ?.getAttribute("data-hidden")
      ).toBe("false");
      expect(capturedTween).toBeNull();
    } finally {
      window.matchMedia = prevMatch;
    }
  });

  it("preserves mobile full-res idle settle paint on sub-frame jitter, deduplicates blob fetches, and keeps poster visible if 2D context is null", async () => {
    class MockImageBitmap {
      close = vi.fn();
      height: number;
      width: number;
      constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
      }
    }

    const prevW = window.innerWidth;
    const prevH = window.innerHeight;
    const prevMatch = window.matchMedia;
    const prevFetch = globalThis.fetch;
    const prevImageBitmap = globalThis.ImageBitmap;
    const prevCreateBitmap = globalThis.createImageBitmap;
    const drawSizes: [number, number][] = [];
    const createdBitmaps: MockImageBitmap[] = [];

    const mockCtx = {
      createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
      drawImage: vi.fn((source: { height: number; width: number }) => {
        drawSizes.push([source.width, source.height]);
      }),
      fillRect: vi.fn(),
      fillStyle: "#000000",
      globalAlpha: 1,
      imageSmoothingEnabled: true,
      imageSmoothingQuality: "high",
      restore: vi.fn(),
      save: vi.fn(),
    };

    const getContextSpy = vi
      .spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockReturnValue(mockCtx as unknown as CanvasRenderingContext2D);
    vi.spyOn(
      HTMLCanvasElement.prototype,
      "getBoundingClientRect"
    ).mockReturnValue({
      bottom: 844,
      height: 844,
      left: 0,
      right: 390,
      toJSON: () => ({}),
      top: 0,
      width: 390,
      x: 0,
      y: 0,
    });

    const fetchSpy = vi.fn((_url: RequestInfo | URL) =>
      Promise.resolve({
        blob: () => Promise.resolve(new Blob(["webp"])),
        ok: true,
      })
    );

    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 390,
    });
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 844,
    });
    window.matchMedia = vi.fn((query: string) => ({
      addEventListener: vi.fn(),
      matches: query === "(pointer: coarse)",
      removeEventListener: vi.fn(),
    })) as unknown as typeof window.matchMedia;
    globalThis.fetch = fetchSpy as unknown as typeof fetch;
    globalThis.ImageBitmap = MockImageBitmap as unknown as typeof ImageBitmap;
    globalThis.createImageBitmap = vi.fn(
      (_blob: ImageBitmapSource, opts?: ImageBitmapOptions) => {
        const bm = new MockImageBitmap(
          opts?.resizeWidth ?? 1440,
          opts?.resizeHeight ?? 1800
        );
        createdBitmaps.push(bm);
        return Promise.resolve(bm as unknown as ImageBitmap);
      }
    ) as unknown as typeof createImageBitmap;

    try {
      render(
        <NextIntlClientProvider locale="en" messages={MESSAGES}>
          <Maru60ScrollCinema />
        </NextIntlClientProvider>
      );

      await waitFor(() => {
        expect(capturedTween).not.toBeNull();
      });

      // Scroll to odd uncached frame 37 and let the 160ms full-res settle fire.
      act(() => {
        if (capturedTween) {
          capturedTween.target.frame = 37;
          capturedTween.scrollTrigger.progress = 37 / 119;
          capturedTween.onUpdate?.();
        }
      });

      await waitFor(() => {
        expect(drawSizes.some(([w, h]) => w === 1440 && h === 1800)).toBe(true);
      });

      const fullResBitmaps = createdBitmaps.filter(
        (b) => b.width === 1440 && b.height === 1800
      );
      expect(fullResBitmaps.length).toBeGreaterThanOrEqual(1);
      for (const bm of fullResBitmaps) {
        expect(bm.close).toHaveBeenCalledTimes(1);
      }

      // Sub-frame scroll jitter (37.2 still rounds to 37) must NOT overwrite full-res paint!
      const drawsAfterSettle = drawSizes.length;
      act(() => {
        if (capturedTween) {
          capturedTween.target.frame = 37.2;
          capturedTween.scrollTrigger.progress = 37.2 / 119;
          capturedTween.onUpdate?.();
        }
      });
      expect(drawSizes.length).toBe(drawsAfterSettle);

      // Verify frame 37 was fetched at most once (blob cache dedupe).
      const f37Fetches = fetchSpy.mock.calls.filter(([url]) =>
        String(url).includes("/f37.webp")
      );
      expect(f37Fetches).toHaveLength(1);

      // Verify poster stays visible if canvas 2D context is unavailable.
      cleanup();
      capturedTween = null;
      getContextSpy.mockReturnValue(null);
      render(
        <NextIntlClientProvider locale="en" messages={MESSAGES}>
          <Maru60ScrollCinema />
        </NextIntlClientProvider>
      );
      await waitFor(() => {
        expect(capturedTween).not.toBeNull();
      });
      expect(
        screen
          .getByTestId("maru60-scroll-cinema")
          .querySelector("img.store-maru-cinema-poster")
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
    }
  });

  it("re-schedules mobile full-res refine on offscreen re-entry and switches to full desktop load when widened", async () => {
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

    const drawSizes: [number, number][] = [];
    const desktopLoadedUrls: string[] = [];

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
        this.naturalWidth = 1440;
        this.naturalHeight = 1800;
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
      globalAlpha: 1,
      imageSmoothingEnabled: true,
      imageSmoothingQuality: "high",
      restore: vi.fn(),
      save: vi.fn(),
    };

    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      mockCtx as unknown as CanvasRenderingContext2D
    );
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
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        blob: () => Promise.resolve(new Blob(["webp"])),
        ok: true,
      })
    ) as unknown as typeof fetch;
    globalThis.ImageBitmap = MockImageBitmap as unknown as typeof ImageBitmap;
    globalThis.createImageBitmap = vi.fn(
      (_blob: ImageBitmapSource, opts?: ImageBitmapOptions) =>
        Promise.resolve(
          new MockImageBitmap(
            opts?.resizeWidth ?? 1440,
            opts?.resizeHeight ?? 1800
          ) as unknown as ImageBitmap
        )
    ) as unknown as typeof createImageBitmap;
    globalThis.IntersectionObserver =
      MockIntersectionObserver as unknown as typeof IntersectionObserver;
    globalThis.ResizeObserver =
      MockResizeObserver as unknown as typeof ResizeObserver;
    window.Image = MockHtmlImage as unknown as typeof window.Image;

    try {
      render(
        <NextIntlClientProvider locale="en" messages={MESSAGES}>
          <Maru60ScrollCinema />
        </NextIntlClientProvider>
      );

      // 1. Enter viewport on mobile (375×667) -> settle at odd frame 55.
      act(() => {
        ioCallback?.([{ isIntersecting: true }]);
      });
      await waitFor(() => {
        expect(capturedTween).not.toBeNull();
      });
      act(() => {
        if (capturedTween) {
          capturedTween.target.frame = 55;
          capturedTween.scrollTrigger.progress = 55 / 119;
          capturedTween.onUpdate?.();
        }
      });
      await waitFor(() => {
        expect(drawSizes.some(([w, h]) => w === 1440 && h === 1800)).toBe(true);
      });

      // 2. Scroll offscreen >450ms (evicts mobile bitmaps), then jump straight back in.
      const fullResCountBefore = drawSizes.filter(
        ([w, h]) => w === 1440 && h === 1800
      ).length;
      act(() => {
        ioCallback?.([{ isIntersecting: false }]);
      });
      await new Promise((r) => setTimeout(r, 520));
      act(() => {
        ioCallback?.([{ isIntersecting: true }]);
      });
      await waitFor(() => {
        const fullResCountAfter = drawSizes.filter(
          ([w, h]) => w === 1440 && h === 1800
        ).length;
        expect(fullResCountAfter).toBeGreaterThan(fullResCountBefore);
      });

      // 3. Widen active mobile tab to 1366×657 desktop -> must switch to full desktop HTMLImageElement preload.
      Object.defineProperty(window, "innerWidth", {
        configurable: true,
        value: 1366,
      });
      Object.defineProperty(window, "innerHeight", {
        configurable: true,
        value: 657,
      });
      currentRect = { height: 657, width: 1366 };
      const canvasEl = screen
        .getByTestId("maru60-scroll-cinema")
        .querySelector("canvas") as HTMLCanvasElement;
      act(() => {
        roCallback?.([{ target: canvasEl }]);
      });
      await waitFor(() => {
        expect(desktopLoadedUrls.length).toBeGreaterThan(0);
      });
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
    }
  });
});
