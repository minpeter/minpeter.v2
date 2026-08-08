import { cacheLife, cacheTag } from "next/cache";

import { blog, getPostsMetadata, type postMetadataType } from "@/shared/source";

/**
 * Locale-scoped post list for the blog index and runtime prefetches.
 * Invalidated per deploy (build id) and via cacheTag if content revalidation is added later.
 */
export async function getCachedPostsForLocale(
  locale: string
): Promise<postMetadataType[]> {
  "use cache";
  cacheLife("days");
  cacheTag("blog-posts", `blog-posts-${locale}`);

  return getPostsMetadata(blog.getPages(locale)).filter((post) =>
    post.lang.includes(locale)
  );
}
