import type { SortedResult } from "fumadocs-core/search";
import { describe, expect, it } from "vitest";

import type { postMetadataType } from "@/shared/source";

import { extractMatchedUrls, filterByTitle } from "./post-search";

function makePost(title: string): postMetadataType {
  return {
    draft: false,
    lang: ["en"],
    published: new Date("2024-03-05T00:00:00Z"),
    title,
    url: "/blog/a-post",
  };
}

describe(extractMatchedUrls, () => {
  it("collects page result urls as-is", () => {
    const results = [
      { type: "page", url: "/blog/a" },
      { type: "page", url: "/blog/b" },
    ] as SortedResult[];

    expect([...extractMatchedUrls(results)].toSorted()).toStrictEqual([
      "/blog/a",
      "/blog/b",
    ]);
  });

  it("strips the hash from heading and text results", () => {
    const results = [
      { type: "heading", url: "/blog/a#section-1" },
      { type: "text", url: "/blog/a#paragraph" },
      { type: "text", url: "/blog/b" },
    ] as SortedResult[];

    expect([...extractMatchedUrls(results)].toSorted()).toStrictEqual([
      "/blog/a",
      "/blog/b",
    ]);
  });

  it("returns an empty set for no results", () => {
    expect(extractMatchedUrls([]).size).toBe(0);
  });
});

describe(filterByTitle, () => {
  const posts = [makePost("Traefik Proxy 설정"), makePost("New Year Clock")];

  it("matches titles case-insensitively", () => {
    expect(filterByTitle(posts, "traefik")).toStrictEqual([posts[0]]);
    expect(filterByTitle(posts, "CLOCK")).toStrictEqual([posts[1]]);
  });

  it("matches Korean titles", () => {
    expect(filterByTitle(posts, "설정")).toStrictEqual([posts[0]]);
  });

  it("returns every post for an empty query", () => {
    expect(filterByTitle(posts, "")).toStrictEqual(posts);
  });

  it("returns nothing when no title matches", () => {
    expect(filterByTitle(posts, "zzz")).toStrictEqual([]);
  });
});
