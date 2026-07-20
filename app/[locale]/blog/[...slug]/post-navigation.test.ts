import { describe, expect, it } from "vitest";

import { getAdjacentPosts } from "./post-navigation";

function makePost(
  slug: string,
  published: string,
  external_url?: string
): {
  data: { external_url?: string; published: Date; title: string };
  slugs: string[];
  url: string;
} {
  return {
    data: { external_url, published: new Date(published), title: slug },
    slugs: [slug],
    url: `/blog/${slug}`,
  };
}

const posts = [
  makePost("oldest", "2023-01-01"),
  makePost("middle", "2024-01-01"),
  makePost("newest", "2025-01-01"),
];

describe(getAdjacentPosts, () => {
  it("returns both neighbours for a middle post", () => {
    const { nextPost, previousPost } = getAdjacentPosts(posts, "middle");

    expect(previousPost?.slugs).toStrictEqual(["newest"]);
    expect(nextPost?.slugs).toStrictEqual(["oldest"]);
  });

  it("returns no previous post for the newest post", () => {
    const { nextPost, previousPost } = getAdjacentPosts(posts, "newest");

    expect(previousPost).toBeNull();
    expect(nextPost?.slugs).toStrictEqual(["middle"]);
  });

  it("returns no next post for the oldest post", () => {
    const { nextPost, previousPost } = getAdjacentPosts(posts, "oldest");

    expect(previousPost?.slugs).toStrictEqual(["middle"]);
    expect(nextPost).toBeNull();
  });

  it("excludes external posts from navigation", () => {
    const withExternal = [
      makePost("oldest", "2023-01-01"),
      makePost("external", "2024-06-01", "https://example.com"),
      makePost("newest", "2025-01-01"),
    ];

    const { nextPost, previousPost } = getAdjacentPosts(
      withExternal,
      "newest"
    );

    expect(previousPost).toBeNull();
    expect(nextPost?.slugs).toStrictEqual(["oldest"]);
  });

  it("returns nulls when the current post is not in the list", () => {
    expect(getAdjacentPosts(posts, "missing")).toStrictEqual({
      nextPost: null,
      previousPost: null,
    });
  });

  it("sorts posts newest-first regardless of input order", () => {
    const shuffled = [posts[2], posts[0], posts[1]];

    const { nextPost, previousPost } = getAdjacentPosts(shuffled, "middle");

    expect(previousPost?.slugs).toStrictEqual(["newest"]);
    expect(nextPost?.slugs).toStrictEqual(["oldest"]);
  });
});
