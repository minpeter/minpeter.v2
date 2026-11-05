import { describe, expect, it } from "vitest";

import { decodeSlugs } from "./decode-slugs";

describe("decodeSlugs", () => {
  it("decodes percent-encoded segments such as external post colons", () => {
    expect(decodeSlugs(["tiny-ko%3Awandb"])).toStrictEqual(["tiny-ko:wandb"]);
  });

  it("never decodes an encoded slash into a path separator", () => {
    expect(decodeSlugs(["a%2Fb", "c"])).toStrictEqual(["a%2Fb", "c"]);
    expect(decodeSlugs(["a%2fb%3Ac"])).toStrictEqual(["a%2fb%3Ac"]);
  });

  it("keeps raw and malformed segments untouched", () => {
    expect(decodeSlugs(["a:b", "100%"])).toStrictEqual(["a:b", "100%"]);
  });

  it("defaults to an empty slug list", () => {
    expect(decodeSlugs()).toStrictEqual([]);
  });
});
