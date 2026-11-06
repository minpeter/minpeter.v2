import { describe, expect, it } from "vitest";

import { getTranslatedLocales, isTranslated } from "./post-locales";

const pages: Record<string, Record<string, string>> = {
  both: {
    en: "both/index.en.mdx",
    ja: "both/index.ja.mdx",
    ko: "both/index.mdx",
  },
  external: {
    en: "(external)/x:y.mdx",
    ja: "(external)/x:y.mdx",
    ko: "(external)/x:y.mdx",
  },
  flat: { en: "flat.en.mdx", ja: "flat.mdx", ko: "flat.mdx" },
  // Korean-only: fumadocs serves the Korean file for every locale.
  koOnly: {
    en: "ko-only/index.mdx",
    ja: "ko-only/index.mdx",
    ko: "ko-only/index.mdx",
  },
  // A post named like a locale must not be mistaken for a translation.
  trickyName: { en: "x/pen.mdx", ja: "x/pen.mdx", ko: "x/pen.mdx" },
};
// Only the default-locale file's frontmatter: lang ["ko"] unless listed here.
const langs: Record<string, string[]> = { external: ["en", "ko", "ja"] };

const resolve = (key: string) => (locale: "ko" | "en" | "ja") => {
  const path = pages[key]?.[locale];
  return path ? { data: { lang: langs[key] ?? ["ko"] }, path } : undefined;
};

describe("post translation detection", () => {
  it("treats the default locale as always translated", () => {
    expect(isTranslated({ path: "a/index.mdx" }, "ko", "ko")).toBe(true);
  });

  it.each([
    ["both", ["ko", "en", "ja"]],
    ["koOnly", ["ko"]],
    ["trickyName", ["ko"]],
    ["flat", ["ko", "en"]],
    ["external", ["ko", "en", "ja"]],
  ])("%s → %o", (key, expected) => {
    expect(
      getTranslatedLocales(resolve(key), ["ko", "en", "ja"], "ko")
    ).toEqual(expected);
  });
});
