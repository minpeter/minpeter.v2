import { describe, expect, it } from "vitest";

import NewMetadata, { getLocalizedPath } from "./metadata";

describe("shared metadata", () => {
  it("builds locale-aware canonical and Open Graph metadata", () => {
    const metadata = NewMetadata({
      description: "Showcase",
      locale: "en",
      path: "/show",
      title: "minpeter | showcase",
    });

    expect(metadata.alternates).toMatchObject({
      canonical: "/en/show",
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
    const metadata = NewMetadata({
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

  it("does not override file-based metadata images when no image is supplied", () => {
    const metadata = NewMetadata({ title: "minpeter | showcase" });

    expect(metadata.openGraph).not.toHaveProperty("images");
    expect(metadata.twitter).not.toHaveProperty("images");
  });

  it("creates article metadata for blog posts", () => {
    const metadata = NewMetadata({
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
});
