import { describe, expect, it, vi } from "vitest";

import sitemapConfig from "./next-sitemap.config.js";
import { defaultLocale, locales } from "./shared/i18n/locales.js";
import { routing } from "./shared/i18n/routing";

interface SitemapEntry {
  alternateRefs: { href: string; hreflang: string }[];
  changefreq: string;
  lastmod?: string;
  loc: string;
  priority: number;
}

const transform = (path: string) =>
  (sitemapConfig.transform as (config: object, path: string) => SitemapEntry)(
    {},
    path
  );

describe("next-sitemap.config.js", () => {
  it("excludes redirected product URLs and publishes localized Maru60 alternates", () => {
    for (const prefix of ["", "/ko", "/en", "/ja"]) {
      expect(transform(`${prefix}/products/rule60-hhkb-unibody`)).toBeNull();
      const entry = transform(`${prefix}/products/maru60`);
      expect(entry.loc).toBe(
        `${prefix === "/ko" ? "" : prefix}/products/maru60`
      );
      expect(entry.alternateRefs.map((item) => item.href)).toContain(
        "https://minpeter.com/products/maru60"
      );
    }
  });
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
    // Blog posts depend on the build manifest (covered below); use a page that
    // exists in every locale.
    const { alternateRefs } = transform("/en/show");

    expect(alternateRefs.map((ref) => ref.hreflang)).toStrictEqual([
      ...locales,
      "x-default",
    ]);
    expect(alternateRefs.at(-1)?.href).toBe("https://minpeter.com/show");
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

  it("lists only prerendered editions of a blog post as alternates", async () => {
    const { mkdtempSync, mkdirSync, rmSync, writeFileSync } = await import(
      "node:fs"
    );
    const { tmpdir } = await import("node:os");
    const { join } = await import("node:path");
    const dir = mkdtempSync(join(tmpdir(), "sitemap-"));
    mkdirSync(join(dir, ".next"));
    writeFileSync(
      join(dir, ".next/prerender-manifest.json"),
      JSON.stringify({
        routes: {
          "/en/blog/both": {},
          "/en/blog/no-korean": {},
          "/ja/blog/both": {},
          "/ja/blog/no-korean": {},
          "/ko/blog/both": {},
          "/ko/blog/ko-only": {},
        },
      })
    );
    const cwd = process.cwd();
    process.chdir(dir);
    try {
      vi.resetModules();
      const fresh = (await import("./next-sitemap.config.js")).default;
      const run = (path: string) =>
        (fresh.transform as (config: object, path: string) => SitemapEntry)(
          {},
          path
        );

      expect(
        run("/ko/blog/both").alternateRefs.map((ref) => ref.hreflang)
      ).toStrictEqual(["en", "ko", "ja", "x-default"]);
      expect(run("/ko/blog/ko-only").alternateRefs).toStrictEqual([]);
      // Two non-default editions still form an alternate set (no x-default).
      expect(
        run("/en/blog/no-korean").alternateRefs.map((ref) => ref.hreflang)
      ).toStrictEqual(["en", "ja"]);
      // Non-blog pages exist in every locale regardless of the manifest.
      expect(run("/ko/show").alternateRefs).toHaveLength(4);
      expect(run("/ko/show").lastmod).toBeUndefined();
    } finally {
      process.chdir(cwd);
      rmSync(dir, { force: true, recursive: true });
    }
  });

  it("derives blog post lastmod from MDX frontmatter instead of build time", async () => {
    const { mkdtempSync, mkdirSync, rmSync, writeFileSync } = await import(
      "node:fs"
    );
    const { tmpdir } = await import("node:os");
    const { join } = await import("node:path");
    const dir = mkdtempSync(join(tmpdir(), "sitemap-lastmod-"));
    mkdirSync(join(dir, "content/blog/sample-post"), { recursive: true });
    mkdirSync(join(dir, "content/blog/(awa)/grouped-post"), {
      recursive: true,
    });
    writeFileSync(
      join(dir, "content/blog/sample-post/index.mdx"),
      "---\npublished: 2024-12-22 21:16:00\ntitle: Sample\n---\nBody\n"
    );
    writeFileSync(
      join(dir, "content/blog/(awa)/grouped-post/index.mdx"),
      "---\npublished: 2025-03-10 09:00:00\ntitle: Grouped\n---\nBody\n"
    );
    const cwd = process.cwd();
    process.chdir(dir);
    try {
      vi.resetModules();
      const fresh = (await import("./next-sitemap.config.js")).default;
      const run = (path: string) =>
        (fresh.transform as (config: object, path: string) => SitemapEntry)(
          { autoLastmod: true },
          path
        );

      expect(run("/ko/blog/sample-post").lastmod).toBe(
        "2024-12-22T12:16:00.000Z"
      );
      expect(run("/en/blog/sample-post").lastmod).toBe(
        "2024-12-22T12:16:00.000Z"
      );
      expect(run("/en/blog/grouped-post").lastmod).toBe(
        "2025-03-10T00:00:00.000Z"
      );
      expect(run("/en/resume").lastmod).toBeUndefined();
    } finally {
      process.chdir(cwd);
      rmSync(dir, { force: true, recursive: true });
    }
  });
});
