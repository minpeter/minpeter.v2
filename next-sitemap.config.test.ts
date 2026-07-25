import { describe, expect, it } from "vitest";

import sitemapConfig from "./next-sitemap.config.js";
import { defaultLocale, locales } from "./shared/i18n/locales.js";
import { routing } from "./shared/i18n/routing";

interface SitemapEntry {
  alternateRefs: { href: string; hreflang: string }[];
  changefreq: string;
  loc: string;
  priority: number;
}

const transform = (path: string) =>
  (sitemapConfig.transform as (config: object, path: string) => SitemapEntry)(
    {},
    path
  );

describe("next-sitemap.config.js", () => {
  it("derives its locales from the same module as next-intl routing", () => {
    // The guard this file exists for: the sitemap used to re-declare the
    // locale list, so adding a locale silently produced a sitemap missing it.
    expect([...locales]).toStrictEqual([...routing.locales]);
    expect(defaultLocale).toBe(routing.defaultLocale);
  });

  it("strips the default-locale prefix", () => {
    expect(transform(`/${defaultLocale}/blog/post`).loc).toBe("/blog/post");
    expect(transform(`/${defaultLocale}`).loc).toBe("/");
  });

  it("keeps the prefix for non-default locales", () => {
    expect(transform("/en/blog/post").loc).toBe("/en/blog/post");
    expect(transform("/ja").loc).toBe("/ja");
  });

  it("emits one hreflang per locale plus x-default", () => {
    const { alternateRefs } = transform("/en/blog/post");

    expect(alternateRefs.map((ref) => ref.hreflang)).toStrictEqual([
      ...locales,
      "x-default",
    ]);
    expect(alternateRefs.at(-1)?.href).toBe("https://minpeter.com/blog/post");
  });

  it("ranks every localized homepage as the top priority", () => {
    for (const locale of locales) {
      const path = locale === defaultLocale ? "/" : `/${locale}`;
      expect(transform(path).priority).toBe(1);
    }
  });

  it("ranks blog paths above other pages", () => {
    expect(transform("/en/blog/post").priority).toBe(0.8);
    expect(transform("/en/show").priority).toBe(0.7);
  });

  it("drops unlisted hash routes for every locale", () => {
    const hash = "a".repeat(32);

    expect(transform(`/${hash}`)).toBeNull();
    for (const locale of locales) {
      expect(transform(`/${locale}/${hash}`)).toBeNull();
    }
  });
});
