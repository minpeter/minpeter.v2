import { describe, expect, it } from "vitest";

import {
  getOgTitleSize,
  getOgTitleVisualWidth,
  getTitleTokens,
} from "./og-title";

describe(getOgTitleVisualWidth, () => {
  it("counts latin letters at the default width", () => {
    expect(getOgTitleVisualWidth("Hello")).toBeCloseTo(5 * 0.62);
  });

  it("counts CJK characters as full width", () => {
    expect(getOgTitleVisualWidth("한글")).toBe(2);
    expect(getOgTitleVisualWidth("日本語")).toBe(3);
  });

  it("counts spaces and narrow punctuation at 0.35", () => {
    expect(getOgTitleVisualWidth(" ")).toBe(0.35);
    expect(getOgTitleVisualWidth("I")).toBe(0.35);
    expect(getOgTitleVisualWidth("!")).toBe(0.35);
  });

  it("counts wide latin characters at 0.85", () => {
    expect(getOgTitleVisualWidth("M")).toBe(0.85);
    expect(getOgTitleVisualWidth("@")).toBe(0.85);
  });

  it("sums mixed character widths", () => {
    expect(getOgTitleVisualWidth("I M")).toBeCloseTo(0.35 + 0.35 + 0.85);
  });

  it("returns 0 for an empty title", () => {
    expect(getOgTitleVisualWidth("")).toBe(0);
  });
});

describe(getOgTitleSize, () => {
  it("caps the size at 54 for short titles", () => {
    expect(getOgTitleSize(0)).toBe(54);
    expect(getOgTitleSize(10)).toBe(54);
    expect(getOgTitleSize(17)).toBe(54);
  });

  it("floors the fitted size", () => {
    expect(getOgTitleSize(20)).toBe(48);
  });

  it("clamps the size at 28 for long titles", () => {
    expect(getOgTitleSize(40)).toBe(28);
    expect(getOgTitleSize(100)).toBe(28);
  });
});

describe(getTitleTokens, () => {
  it("keeps each CJK character in its own token", () => {
    expect(getTitleTokens("한글")).toStrictEqual([
      { isCjk: true, text: "한" },
      { isCjk: true, text: "글" },
    ]);
  });

  it("attaches a trailing space to the preceding latin token", () => {
    expect(getTitleTokens("Hello World")).toStrictEqual([
      { isCjk: false, text: "Hello " },
      { isCjk: false, text: "World" },
    ]);
  });

  it("starts a new latin token after CJK characters", () => {
    expect(getTitleTokens("한글ABC")).toStrictEqual([
      { isCjk: true, text: "한" },
      { isCjk: true, text: "글" },
      { isCjk: false, text: "ABC" },
    ]);
  });

  it("attaches a space before CJK to the latin token", () => {
    expect(getTitleTokens("AB 한")).toStrictEqual([
      { isCjk: false, text: "AB " },
      { isCjk: true, text: "한" },
    ]);
  });

  it("returns no tokens for an empty title", () => {
    expect(getTitleTokens("")).toStrictEqual([]);
  });
});
