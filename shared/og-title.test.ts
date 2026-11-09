import { describe, expect, it } from "vitest";

import {
  getOgTitleSize,
  getOgTitleVisualWidth,
  getTitleTokens,
  OG_CJK_SCALE,
} from "./og-title";

describe(getOgTitleVisualWidth, () => {
  it("counts latin letters at the default width", () => {
    expect(getOgTitleVisualWidth("Hello")).toBeCloseTo(5 * 0.6);
  });

  it("counts CJK characters at the scaled CJK size", () => {
    expect(getOgTitleVisualWidth("한글")).toBeCloseTo(2 * OG_CJK_SCALE);
    expect(getOgTitleVisualWidth("日本語")).toBeCloseTo(3 * OG_CJK_SCALE);
  });

  it("counts narrow punctuation at 0.4", () => {
    expect(getOgTitleVisualWidth("I")).toBe(0.4);
    expect(getOgTitleVisualWidth("!")).toBe(0.4);
  });

  it("counts spaces, digits and medium letters at 0.5", () => {
    expect(getOgTitleVisualWidth(" ")).toBe(0.5);
    expect(getOgTitleVisualWidth("1")).toBe(0.5);
    expect(getOgTitleVisualWidth("L")).toBe(0.5);
  });

  it("counts wide latin characters at 0.8 and the em dash at 1", () => {
    expect(getOgTitleVisualWidth("M")).toBe(0.8);
    expect(getOgTitleVisualWidth("%")).toBe(0.8);
    expect(getOgTitleVisualWidth("\u2014")).toBe(1);
  });

  it("sums mixed character widths", () => {
    expect(getOgTitleVisualWidth("I M")).toBeCloseTo(0.4 + 0.5 + 0.8);
  });

  it("returns 0 for an empty title", () => {
    expect(getOgTitleVisualWidth("")).toBe(0);
  });
});

describe(getOgTitleSize, () => {
  it("caps the size at 54 for short titles", () => {
    expect(getOgTitleSize(0)).toBe(54);
    expect(getOgTitleSize(17)).toBe(54);
  });

  it("floors the fitted size", () => {
    expect(getOgTitleSize(20)).toBe(46);
  });

  it("clamps the size at 28 for long titles", () => {
    expect(getOgTitleSize(40)).toBe(28);
  });
});

describe(getTitleTokens, () => {
  it("keeps each CJK character in its own token", () => {
    expect(getTitleTokens("한글")).toStrictEqual([
      { isCjk: true, offset: 0, text: "한" },
      { isCjk: true, offset: 1, text: "글" },
    ]);
  });

  it("attaches a trailing space to the preceding latin token", () => {
    expect(getTitleTokens("Hello World")).toStrictEqual([
      { isCjk: false, offset: 0, text: "Hello " },
      { isCjk: false, offset: 6, text: "World" },
    ]);
  });

  it("starts a new latin token after CJK characters", () => {
    expect(getTitleTokens("한글ABC")).toStrictEqual([
      { isCjk: true, offset: 0, text: "한" },
      { isCjk: true, offset: 1, text: "글" },
      { isCjk: false, offset: 2, text: "ABC" },
    ]);
  });

  it("attaches a space before CJK to the latin token", () => {
    expect(getTitleTokens("AB 한")).toStrictEqual([
      { isCjk: false, offset: 0, text: "AB " },
      { isCjk: true, offset: 3, text: "한" },
    ]);
  });

  it("returns no tokens for an empty title", () => {
    expect(getTitleTokens("")).toStrictEqual([]);
  });
});
