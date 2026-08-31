import { describe, expect, it } from "vitest";

import {
  limitBlogQuery,
  MAX_BLOG_QUERY_CODE_POINTS,
  normalizeBlogQuery,
} from "./blog-search-query";

describe(limitBlogQuery, () => {
  it("preserves whitespace in controlled input values", () => {
    expect(limitBlogQuery("cache ")).toBe("cache ");
  });

  it("limits raw input by Unicode code point", () => {
    const query = ` ${"😀".repeat(MAX_BLOG_QUERY_CODE_POINTS)}`;

    expect(Array.from(limitBlogQuery(query))).toHaveLength(
      MAX_BLOG_QUERY_CODE_POINTS
    );
  });
});

describe(normalizeBlogQuery, () => {
  it("trims surrounding whitespace", () => {
    expect(normalizeBlogQuery("  cache components  ")).toBe("cache components");
  });

  it("normalizes whitespace-only input to an empty query", () => {
    expect(normalizeBlogQuery(" \n\t ")).toBe("");
  });

  it("trims before limiting by Unicode code point", () => {
    const canonicalQuery = "😀".repeat(MAX_BLOG_QUERY_CODE_POINTS);

    expect(normalizeBlogQuery(` ${canonicalQuery}`)).toBe(canonicalQuery);
  });
});
