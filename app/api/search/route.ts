import type { SortedResult } from "fumadocs-core/search";
import { createFromSource } from "fumadocs-core/search/server";

import { normalizeBlogQuery } from "@/shared/blog-search-query";
import { blog } from "@/shared/source";

const MAX_SEARCH_RESULTS = 60;

interface SearchOptions {
  readonly limit: number;
  readonly locale: string | null;
  readonly mode: "full" | "vector";
  readonly tag: string[] | undefined;
}

type Search = (
  query: string,
  options: SearchOptions
) => Promise<SortedResult[]>;

const searchApi = createFromSource(blog);

function getSearchLimit(url: URL): number {
  const requestedLimit = Number(url.searchParams.get("limit"));
  return Number.isInteger(requestedLimit) && requestedLimit > 0
    ? Math.min(requestedLimit, MAX_SEARCH_RESULTS)
    : MAX_SEARCH_RESULTS;
}

export async function handleSearchRequest(
  request: Request,
  search: Search
): Promise<Response> {
  const url = new URL(request.url);
  const query = normalizeBlogQuery(url.searchParams.get("query") ?? "");
  if (!query) {
    return Response.json([]);
  }

  const tag = url.searchParams.get("tag");
  const limit = getSearchLimit(url);
  const results = await search(query, {
    limit,
    locale: url.searchParams.get("locale"),
    mode: url.searchParams.get("mode") === "vector" ? "vector" : "full",
    tag: tag ? tag.split(",") : undefined,
  });

  return Response.json(results.slice(0, limit));
}

export function GET(request: Request): Promise<Response> {
  return handleSearchRequest(request, searchApi.search);
}
