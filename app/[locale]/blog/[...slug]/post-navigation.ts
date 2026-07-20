interface PostNavItem {
  data: {
    external_url?: string;
    published: Date;
  };
  slugs: string[];
}

export function getAdjacentPosts<T extends PostNavItem>(
  posts: T[],
  currentPostPath: string
): { nextPost: T | null; previousPost: T | null } {
  const sortedPosts = posts
    .filter((item) => !item.data.external_url)
    .toSorted(
      (a, b) => b.data.published.getTime() - a.data.published.getTime()
    );

  const currentPostIndex = sortedPosts.findIndex(
    (item) => item.slugs.join("/") === currentPostPath
  );

  return {
    nextPost:
      currentPostIndex === -1
        ? null
        : (sortedPosts[currentPostIndex + 1] ?? null),
    previousPost:
      currentPostIndex > 0 ? sortedPosts[currentPostIndex - 1] : null,
  };
}
