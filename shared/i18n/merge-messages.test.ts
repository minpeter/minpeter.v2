import { describe, expect, it } from "vitest";

import { mergeMessages } from "./merge-messages";

describe("mergeMessages", () => {
  it("prefers current messages and falls back per nested key", () => {
    const merged = mergeMessages(
      { home: { greeting: "안녕", title: "홈" }, only: "기본" },
      { home: { title: "Home" } }
    );

    expect(merged).toEqual({
      home: { greeting: "안녕", title: "Home" },
      only: "기본",
    });
  });

  it("keeps a __proto__ key as data without touching prototypes", () => {
    const current = JSON.parse('{"__proto__": {"polluted": "yes"}}');
    const merged = mergeMessages({ a: "a" }, current);

    expect(Object.getPrototypeOf(merged)).toBe(Object.prototype);
    expect(Object.hasOwn(merged, "__proto__")).toBe(true);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });
});
