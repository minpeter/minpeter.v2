import { describe, expect, it } from "vitest";

import {
  computeCinemaDrawRect,
  findNearestLoadedFrame,
  getCinemaSafeHeight,
  getCinemaSafeWidth,
} from "./skateboard-stand-scroll-cinema";

const SRC_W = 2560;
const SRC_H = 1440;

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

    // Target 5 is closer to frame 8 (dist 3) than frame 0 (dist 5)
    expect(findNearestLoadedFrame(frames, 5, isString)).toEqual({
      frame: "f8",
      index: 8,
    });
    // Target 2 falls back to frame 0 and reports index 0 (not 2) so newly loaded frames still trigger repaint
    expect(findNearestLoadedFrame(frames, 2, isString)).toEqual({
      frame: "f0",
      index: 0,
    });
    // Exact match returns itself
    expect(findNearestLoadedFrame(frames, 8, isString)).toEqual({
      frame: "f8",
      index: 8,
    });
  });
});
