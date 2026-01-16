"use client";

import type { SortedResult } from "fumadocs-core/search";
import { useDocsSearch } from "fumadocs-core/search/client";
import { ExternalLink, Loader2, Search, X } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { debounce, parseAsString, useQueryState } from "nuqs";
import { useDeferredValue, useEffect, useMemo, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import type { postMetadataType } from "@/shared/source";
import styles from "@/shared/styles/stagger-fade-in.module.css";
import { formatDate, formatYear } from "@/shared/utils/date";
import { cn } from "@/shared/utils/tailwind";

/**
 * Extract unique page URLs from search results
 */
function extractMatchedUrls(results: SortedResult[]): Set<string> {
  const matchedUrls = new Set<string>();

  for (const result of results) {
    if (result.type === "page") {
      matchedUrls.add(result.url);
    } else if (result.type === "heading" || result.type === "text") {
      // Extract base URL (remove hash)
      const baseUrl = result.url.split("#")[0];
      matchedUrls.add(baseUrl);
    }
  }

  return matchedUrls;
}

/**
 * Filter posts by title match
 */
function filterByTitle(
  posts: postMetadataType[],
  query: string
): postMetadataType[] {
  return posts.filter((post) =>
    post.title.toLowerCase().includes(query.toLowerCase())
  );
}

export function BlogList({
  lang,
  posts,
}: {
  lang: string;
  posts: postMetadataType[];
}) {
  const t = useTranslations();
  const [isPending, startTransition] = useTransition();

  // nuqs with debounce for URL updates
  const [query, setQuery] = useQueryState(
    "q",
    parseAsString.withDefault("").withOptions({
      shallow: false, // Notify server for RSC re-render
      limitUrlUpdates: debounce(500), // Debounce URL updates
      startTransition, // Use React transition for non-blocking updates
    })
  );

  // Deferred value for expensive search operations
  const deferredQuery = useDeferredValue(query);

  const { setSearch, query: searchQuery } = useDocsSearch({
    type: "fetch",
    api: "/api/search",
    locale: lang,
  });

  // Sync deferred query with fumadocs search (debounced)
  useEffect(() => {
    setSearch(deferredQuery);
  }, [deferredQuery, setSearch]);

  // Show loading when query differs from deferred (typing) or API is loading
  const isSearching =
    query !== deferredQuery || isPending || searchQuery.isLoading;

  // Filter posts based on search results (use deferredQuery for expensive filtering)
  const filteredPosts = useMemo(() => {
    const byLang = posts.filter((post) => post.lang.includes(lang));

    // If no search query, return all posts filtered by language
    if (!deferredQuery) {
      return byLang;
    }

    // If search is loading or empty, filter by title as fallback
    if (
      searchQuery.isLoading ||
      searchQuery.data === "empty" ||
      !searchQuery.data
    ) {
      return filterByTitle(byLang, deferredQuery);
    }

    // Use API search results - extract unique page URLs
    const matchedUrls = extractMatchedUrls(searchQuery.data);

    // Filter posts that match search results
    const filtered = byLang.filter((post) => matchedUrls.has(post.url));

    // If no matches from API, fallback to title search
    if (filtered.length === 0) {
      return filterByTitle(byLang, deferredQuery);
    }

    return filtered;
  }, [posts, lang, deferredQuery, searchQuery.data, searchQuery.isLoading]);

  return (
    <>
      <div className="relative mb-6">
        <label className="sr-only" htmlFor="blog-search">
          {t("searchPlaceholder")}
        </label>
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          autoComplete="off"
          className="w-full rounded-md border bg-background px-10 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          id="blog-search"
          onChange={(e) => setQuery(e.target.value || null)}
          placeholder={t("searchPlaceholder")}
          type="text"
          value={query}
        />
        {query && (
          <div className="absolute top-1/2 right-3 flex h-4 w-4 -translate-y-1/2 items-center justify-center">
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <button
                aria-label="Clear search"
                className="flex h-4 w-4 items-center justify-center rounded text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => setQuery(null)}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>
      <BlogListFallback posts={filteredPosts} />
    </>
  );
}

export function BlogListFallback({ posts }: { posts: postMetadataType[] }) {
  const t = useTranslations();
  // Posts are already filtered by BlogList component
  const filteredPosts = posts;
  const yearList = filteredPosts.reduce(
    (acc: Record<string, postMetadataType[]>, post) => {
      const year = formatYear(post.date);

      if (!acc[year]) {
        acc[year] = [];
      }

      acc[year].push(post);
      return acc;
    },
    {}
  );

  const itemSytles =
    "group-hover/year:opacity-100! group-hover/post:bg-secondary/100 group-hover/list:opacity-60 rounded-md";

  return (
    <div className={cn(styles.stagger_container, styles.slow, "group/list")}>
      {filteredPosts.length === 0 ? (
        <div className="py-8 text-center">
          <p>{t("noSearchResults")}</p>
        </div>
      ) : (
        Object.keys(yearList)
          .toReversed()
          .map((year) => (
            <div
              className="group/year flex flex-col gap-2 border-t py-8 last-of-type:border-b sm:flex-row"
              key={year}
            >
              <div className="w-24">
                <h2 className="w-fit rounded-md px-2 opacity-60 group-hover/year:bg-secondary/100">
                  {year}
                </h2>
              </div>
              {
                <ul
                  className={cn(styles.stagger_container, "w-full space-y-3")}
                >
                  {yearList[year].map((post: postMetadataType) => (
                    <li
                      className="group/post flex justify-between space-x-4"
                      key={post.url}
                    >
                      {post.external_url ? (
                        <a
                          className={cn(
                            itemSytles,
                            "inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          )}
                          href={post.external_url}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          <span
                            className={cn(
                              "line-clamp-2 inline box-decoration-clone px-1 py-1",
                              itemSytles
                            )}
                          >
                            {post.title}
                            <ExternalLink
                              className="ml-1 inline-block pb-1 opacity-60"
                              size={16}
                            />
                          </span>
                        </a>
                      ) : (
                        <Link
                          className={cn(
                            itemSytles,
                            "inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          )}
                          href={post.url as Route}
                        >
                          <span
                            className={cn(
                              "line-clamp-2 inline box-decoration-clone px-1 py-1",
                              itemSytles
                            )}
                          >
                            {post.title}
                          </span>
                        </Link>
                      )}

                      {post.draft ? (
                        <Badge className="h-fit shrink-0" variant="secondary">
                          Draft
                        </Badge>
                      ) : (
                        <div className={cn(itemSytles, "h-fit text-nowrap")}>
                          {formatDate(post.date)}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              }
            </div>
          ))
      )}
    </div>
  );
}
