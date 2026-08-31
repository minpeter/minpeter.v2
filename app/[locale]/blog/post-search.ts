import type { SortedResult } from "fumadocs-core/search";

import type { postMetadataType } from "@/shared/source";

export const MAX_BLOG_QUERY_CODE_POINTS = 200;

export function limitBlogQuery(query: string): string {
  return Array.from(query).slice(0, MAX_BLOG_QUERY_CODE_POINTS).join("");
}

export function normalizeBlogQuery(query: string): string {
  return limitBlogQuery(query.trim());
}

export function extractMatchedUrls(results: SortedResult[]): Set<string> {
  const matchedUrls = new Set<string>();

  for (const result of results) {
    if (result.type === "page") {
      matchedUrls.add(result.url);
    } else if (result.type === "heading" || result.type === "text") {
      const [baseUrl] = result.url.split("#");
      matchedUrls.add(baseUrl);
    }
  }

  return matchedUrls;
}

export function filterByTitle(
  posts: postMetadataType[],
  query: string
): postMetadataType[] {
  const normalizedQuery = query.toLowerCase();

  return posts.filter((post) =>
    post.title.toLowerCase().includes(normalizedQuery)
  );
}
