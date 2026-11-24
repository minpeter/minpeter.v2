import { describe, expect, it } from "vitest";

import {
  computeCinemaDrawRect,
  getCinemaSafeWidth,
} from "./skateboard-stand-scroll-cinema";

const SRC_W = 2560;
const SRC_H = 1440;

describe("SkateboardStandScrollCinema adaptive framing", () => {
  it("keeps desktop landscape viewports at exact full-bleed cover scale for every frame", () => {
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

  it("fits the wide solo stand cleanly inside portrait mobile viewports during Act I (F00–F12)", () => {
    for (const [vw, vh] of [
      [390, 844],
      [375, 667],
    ] as const) {
      // Widest Act I stand bounds: x in [417..2160] (max half-span 880px from center 1280).
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
    for (let f = 1; f < 60; f += 1) {
      const nextWidth = getCinemaSafeWidth(f);
      expect(nextWidth).toBeLessThanOrEqual(prevWidth);
      prevWidth = nextWidth;
    }

    for (let f = 14; f < 60; f += 1) {
      const rect = computeCinemaDrawRect(vw, vh, SRC_W, SRC_H, f);
      expect(rect.scale).toBeCloseTo(coverScale, 6);
      expect(rect.dh).toBeCloseTo(vh, 1);
    }
  });
});
