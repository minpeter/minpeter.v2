import type { SortedResult } from "fumadocs-core/search";

import type { postMetadataType } from "@/shared/source";

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
  return posts.filter((post) =>
    post.title.toLowerCase().includes(query.toLowerCase())
  );
}
