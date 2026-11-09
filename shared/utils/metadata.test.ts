import { describe, expect, it } from "vitest";

import {
  createMetadata,
  createNotFoundMetadata,
  createSectionImage,
  getLocalizedPath,
  NOT_FOUND_TITLE,
  resolveLocale,
} from "./metadata";

const ABSOLUTE_NOT_FOUND_IMAGE = /^https?:\/\/[^/]+\/og\/not-found$/u;

describe("shared metadata", () => {
  it("builds locale-aware canonical and Open Graph metadata", () => {
    const metadata = createMetadata({
      description: "Showcase",
      locale: "en",
      path: "/show",
      title: "minpeter | showcase",
    });

    expect(metadata.alternates).toMatchObject({
      canonical: "https://minpeter.com/en/show",
      languages: {
        en: "/en/show",
        ja: "/ja/show",
        ko: "/show",
        "x-default": "/show",
      },
    });
    expect(metadata.openGraph).toMatchObject({
      alternateLocale: ["ja_JP", "ko_KR"],
      locale: "en_US",
      type: "website",
      url: "/en/show",
    });
  });

  it("adds complete metadata for an explicitly supplied image", () => {
    const metadata = createMetadata({
      image: { alt: "minpeter | 404", url: "/og/not-found" },
      title: "minpeter | 404",
    });

    expect(metadata.openGraph).toMatchObject({
      images: {
        alt: "minpeter | 404",
        height: 630,
        type: "image/png",
        url: "/og/not-found",
        width: 1200,
      },
    });
    expect(metadata.twitter).toMatchObject({
      images: {
        alt: "minpeter | 404",
        height: 630,
        type: "image/png",
        url: "/og/not-found",
        width: 1200,
      },
    });
  });

  it("builds distinct opengraph-image and twitter-image URLs for section images", () => {
    const metadata = createMetadata({
      image: createSectionImage("ko", "/products", "minpeter | 제품"),
      locale: "ko",
      path: "/products",
      title: "minpeter | 제품",
    });

    expect(metadata.openGraph).toMatchObject({
      images: {
        alt: "minpeter | 제품",
        height: 630,
        type: "image/png",
        url: "/ko/products/opengraph-image",
        width: 1200,
      },
    });
    expect(metadata.twitter).toMatchObject({
      images: {
        alt: "minpeter | 제품",
        height: 630,
        type: "image/png",
        url: "/ko/products/twitter-image",
        width: 1200,
      },
    });
  });

  it("does not override file-based metadata images when no image is supplied", () => {
    const metadata = createMetadata({ title: "minpeter | showcase" });

    expect(metadata.openGraph).not.toHaveProperty("images");
    expect(metadata.twitter).not.toHaveProperty("images");
  });

  it("preserves an intentionally empty description", () => {
    const metadata = createMetadata({ description: "", title: "Title" });

    expect(metadata.description).toBe("");
    expect(metadata.openGraph?.description).toBe("");
    expect(metadata.twitter?.description).toBe("");
  });

  it("creates article metadata for blog posts", () => {
    const metadata = createMetadata({
      article: {
        authors: ["minpeter"],
        modifiedTime: "2026-07-15T00:00:00.000Z",
        publishedTime: "2026-07-14T00:00:00.000Z",
      },
      locale: "ja",
      path: "/blog/example",
      title: "Example",
    });

    expect(metadata.openGraph).toMatchObject({
      authors: ["minpeter"],
      locale: "ja_JP",
      modifiedTime: "2026-07-15T00:00:00.000Z",
      publishedTime: "2026-07-14T00:00:00.000Z",
      type: "article",
    });
  });

  it("omits the default locale prefix from public paths", () => {
    expect(getLocalizedPath("ko", "/resume")).toBe("/resume");
    expect(getLocalizedPath("en", "/resume")).toBe("/en/resume");
    expect(getLocalizedPath("ja", "/")).toBe("/ja");
  });

  it("resolves unsupported route locales to the default locale", () => {
    expect(resolveLocale("en")).toBe("en");
    expect(resolveLocale("unsupported")).toBe("ko");
  });
});

describe("createNotFoundMetadata", () => {
  it("localizes the 404 OG image path", () => {
    const metadata = createNotFoundMetadata({
      description: "Missing",
      locale: "ja",
    });

    expect(metadata.title).toBe(NOT_FOUND_TITLE);
    expect(metadata.description).toBe("Missing");
    expect(metadata.openGraph).toMatchObject({
      images: { alt: NOT_FOUND_TITLE, url: "/ja/og/not-found" },
      locale: "ja_JP",
    });
  });

  it("can emit an absolute image URL for trees without metadataBase", () => {
    const metadata = createNotFoundMetadata({
      absoluteImage: true,
      description: "Missing",
      locale: "ko",
    });

    expect(metadata.openGraph).toMatchObject({
      images: {
        url: expect.stringMatching(ABSOLUTE_NOT_FOUND_IMAGE),
      },
    });
  });
});

describe("createMetadata languages", () => {
  it("lists every locale by default", () => {
    const metadata = createMetadata({ locale: "ko", path: "/blog/x" });

    // Order follows routing.locales.
    expect(Object.keys(metadata.alternates?.languages ?? {})).toStrictEqual([
      "en",
      "ko",
      "ja",
      "x-default",
    ]);
    expect(metadata.openGraph?.alternateLocale).toStrictEqual([
      "en_US",
      "ja_JP",
    ]);
  });

  it("limits hreflang and og:locale:alternate to existing editions", () => {
    const metadata = createMetadata({
      languages: ["ko", "en"],
      locale: "en",
      path: "/blog/x",
    });

    expect(metadata.alternates?.languages).toStrictEqual({
      en: "/en/blog/x",
      ko: "/blog/x",
      "x-default": "/blog/x",
    });
    expect(metadata.openGraph?.alternateLocale).toStrictEqual(["ko_KR"]);
  });

  it("omits x-default when the default locale has no edition", () => {
    const metadata = createMetadata({
      languages: ["en", "ja"],
      locale: "ja",
      path: "/blog/x",
    });

    expect(metadata.alternates?.languages).toStrictEqual({
      en: "/en/blog/x",
      ja: "/ja/blog/x",
    });
    expect(metadata.openGraph?.alternateLocale).toStrictEqual(["en_US"]);
  });

  it("a single-edition post lists only itself", () => {
    const metadata = createMetadata({
      languages: ["ko"],
      locale: "ko",
      path: "/blog/x",
    });

    expect(metadata.alternates?.languages).toStrictEqual({
      ko: "/blog/x",
      "x-default": "/blog/x",
    });
    expect(metadata.openGraph?.alternateLocale).toStrictEqual([]);
  });
});
