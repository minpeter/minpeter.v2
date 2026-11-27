import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import en from "@/shared/i18n/en.json";
import ja from "@/shared/i18n/ja.json";
import {
  getMaru60CinemaBeat,
  getMaru60CinemaFrameSrc,
  MARU60_CINEMA_BEATS,
  MARU60_SCROLL_SEQUENCE,
} from "@/shared/maru60-cinema";

const ko = JSON.parse(readFileSync("shared/i18n/ko.json", "utf8")) as typeof en;
const PUBLIC_ROOT = join(process.cwd(), "public");
const SHORT_DIGEST = /^[a-f0-9]{8}$/u;

describe("MARU60_SCROLL_SEQUENCE", () => {
  it("ships all 120 4:5 WebP cinema frames under /assets/ with contiguous beats and complete i18n copy", () => {
    expect(MARU60_SCROLL_SEQUENCE.frameCount).toBe(120);
    expect(MARU60_SCROLL_SEQUENCE.width).toBe(1440);
    expect(MARU60_SCROLL_SEQUENCE.height).toBe(1800);
    expect(MARU60_SCROLL_SEQUENCE.version).toMatch(SHORT_DIGEST);

    for (let i = 0; i < MARU60_SCROLL_SEQUENCE.frameCount; i += 1) {
      const src = getMaru60CinemaFrameSrc(i);
      expect(src.startsWith("/assets/products/maru60/cinema/")).toBe(true);
      const absPath = join(PUBLIC_ROOT, src);
      expect(existsSync(absPath)).toBe(true);
      expect(statSync(absPath).size).toBeGreaterThan(2000);
    }

    // Beats must cover [0..119] contiguously with zero gaps or overlaps.
    let expectedStart = 0;
    for (const beat of MARU60_CINEMA_BEATS) {
      expect(beat.startFrame).toBe(expectedStart);
      expect(beat.endFrame).toBeGreaterThanOrEqual(beat.startFrame);
      expectedStart = beat.endFrame + 1;

      expect(getMaru60CinemaBeat(beat.startFrame).id).toBe(beat.id);
      expect(getMaru60CinemaBeat(beat.endFrame).id).toBe(beat.id);

      for (const locale of [ko, en, ja]) {
        const caption = locale.products.maru60Cinema.beats[beat.id];
        expect(caption.length).toBeGreaterThan(0);
      }
    }
    expect(expectedStart).toBe(MARU60_SCROLL_SEQUENCE.frameCount);
  });
});
