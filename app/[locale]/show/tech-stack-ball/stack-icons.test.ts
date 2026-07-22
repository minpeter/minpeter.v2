import { describe, expect, it } from "vitest";

import {
  getIconSize,
  getIconTextureScale,
  shuffleArray,
  STACK_ICONS,
} from "./stack-icons";

describe(shuffleArray, () => {
  it("keeps the same elements and length", () => {
    expect(shuffleArray(STACK_ICONS).toSorted()).toStrictEqual(
      STACK_ICONS.toSorted()
    );
  });

  it("does not mutate the input array", () => {
    const input = ["a.png", "b.png", "c.png"];
    const snapshot = [...input];

    shuffleArray(input);

    expect(input).toStrictEqual(snapshot);
  });
});

describe(getIconSize, () => {
  it("clamps to the minimum for narrow canvases", () => {
    expect(getIconSize(100)).toBe(24);
  });

  it("clamps to the maximum for wide canvases", () => {
    expect(getIconSize(1000)).toBe(36);
  });

  it("scales with the canvas width in between", () => {
    expect(getIconSize(400)).toBeCloseTo(28);
  });
});

describe(getIconTextureScale, () => {
  it("uses the GitHub texture dimensions for the GitHub icon", () => {
    expect(getIconTextureScale("GitHub.png", 46)).toStrictEqual({
      x: 46 / 230,
      y: 46 / 225,
    });
  });

  it("uses the base texture dimension for every other icon", () => {
    expect(getIconTextureScale("React.png", 64)).toStrictEqual({
      x: 64 / 512,
      y: 64 / 512,
    });
  });
});

describe("stack icon configuration", () => {
  it("has no duplicate icon files", () => {
    expect(new Set(STACK_ICONS).size).toBe(STACK_ICONS.length);
  });
});
