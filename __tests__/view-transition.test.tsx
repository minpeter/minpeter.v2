// @vitest-environment jsdom
import { describe, expect, it } from "vitest";

describe("View Transitions Shared Element", () => {
  it("blog title view-transition names are unique per slug", () => {
    const slugs = ["/ko/blog/hello", "/ko/blog/world"];
    const names = slugs.map((s) => `blog-title-${s.replace(/\//g, "-")}`);
    expect(new Set(names).size).toBe(names.length); // all unique
  });
});
