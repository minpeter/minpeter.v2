"use client";

import type { SortedResult } from "fumadocs-core/search";
import { useDocsSearch } from "fumadocs-core/search/client";
import { ExternalLink, Loader2, Search, X } from "lucide-react";
import type { Route } from "next";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { debounce, parseAsString, useQueryState } from "nuqs";
import { useCallback, useDeferredValue, useEffect, useTransition } from "react";
import type { ChangeEvent } from "react";

import { Badge } from "@/components/ui/badge";
import { ViewTransition } from "@/components/view-transition";
import type { postMetadataType } from "@/shared/source";
import { formatYear } from "@/shared/utils/date";
import { cn } from "@/shared/utils/tailwind";

import styles from "@/shared/styles/stagger-fade-in.module.css";

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
      const [baseUrl] = result.url.split("#");
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
      limitUrlUpdates: debounce(500), // Debounce URL updates
      shallow: false, // Notify server for RSC re-render
      startTransition, // Use React transition for non-blocking updates
    })
  );

  // Deferred value for expensive search operations
  const deferredQuery = useDeferredValue(query);

  const { setSearch, query: searchQuery } = useDocsSearch({
    api: "/api/search",
    locale: lang,
    type: "fetch",
  });

  // Sync deferred query with fumadocs search (debounced)
  useEffect(() => {
    setSearch(deferredQuery);
  }, [deferredQuery, setSearch]);

  // Show loading while the query is being deferred or the API is loading
  const isSearching =
    query !== deferredQuery || isPending || searchQuery.isLoading;

  const handleQueryChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setQuery(event.target.value || null);
    },
    [setQuery]
  );
  const handleQueryClear = useCallback(() => {
    setQuery(null);
  }, [setQuery]);

  const byLang = posts.filter((post) => post.lang.includes(lang));
  let filteredPosts = byLang;

  if (deferredQuery) {
    if (
      searchQuery.isLoading ||
      searchQuery.data === "empty" ||
      !searchQuery.data
    ) {
      filteredPosts = filterByTitle(byLang, deferredQuery);
    } else {
      const matchedUrls = extractMatchedUrls(searchQuery.data);
      const bySearchResult = byLang.filter((post) => matchedUrls.has(post.url));
      filteredPosts =
        bySearchResult.length === 0
          ? filterByTitle(byLang, deferredQuery)
          : bySearchResult;
    }
  }

  return (
    <>
      <div className="fieldnotes-search">
        <label className="sr-only" htmlFor="blog-search">
          {t("searchPlaceholder")}
        </label>
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          autoComplete="off"
          className="w-full bg-transparent px-10 py-4 text-sm placeholder:text-muted-foreground focus:outline-none"
          id="blog-search"
          onChange={handleQueryChange}
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
                onClick={handleQueryClear}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>
      <BlogListFallback lang={lang} posts={filteredPosts} />
    </>
  );
}

export function BlogListFallback({
  lang = "en",
  posts,
}: {
  lang?: string;
  posts: postMetadataType[];
}) {
  const t = useTranslations();
  // Posts are already filtered by BlogList component
  const filteredPosts = posts;
  const yearList = filteredPosts.reduce(
    (acc: Record<string, postMetadataType[]>, post) => {
      const year = formatYear(post.published);

      if (!acc[year]) {
        acc[year] = [];
      }

      acc[year].push(post);
      return acc;
    },
    {}
  );

  const itemSytles = "transition-opacity duration-200";

  return (
    <div
      className={cn(styles.stagger_container, styles.slow, "fieldnotes-list")}
    >
      {filteredPosts.length === 0 ? (
        <div className="py-8 text-center">
          <p>{t("noSearchResults")}</p>
        </div>
      ) : (
        Object.keys(yearList)
          .toReversed()
          .map((year) => (
            <section className="fieldnotes-year" key={year}>
              <h2 className="fieldnotes-year-heading">{year}</h2>
              <ul
                className={cn(
                  styles.stagger_container,
                  "fieldnotes-year-posts"
                )}
              >
                {yearList[year].map((post: postMetadataType) => (
                  <li className="fieldnotes-item" key={post.url}>
                    {post.external_url ? (
                      <a
                        className={cn(
                          itemSytles,
                          "fieldnotes-item-link focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        )}
                        href={post.external_url}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        <span
                          className={cn(
                            "fieldnotes-item-title line-clamp-2",
                            itemSytles
                          )}
                        >
                          {post.title}
                          <ExternalLink
                            className="ml-1 inline-block pb-1 opacity-60"
                            size={16}
                          />
                        </span>
                        {post.draft ? (
                          <Badge className="h-fit shrink-0" variant="secondary">
                            {t("draft")}
                          </Badge>
                        ) : (
                          <time
                            className="fieldnotes-item-date"
                            dateTime={post.published.toISOString()}
                          >
                            {formatPostDate(post.published, lang)}
                          </time>
                        )}
                      </a>
                    ) : (
                      <Link
                        className={cn(
                          itemSytles,
                          "fieldnotes-item-link focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        )}
                        href={post.url as Route}
                      >
                        <ViewTransition
                          name={`blog-title-${post.url.replaceAll("/", "-")}`}
                        >
                          <span
                            className={cn(
                              "fieldnotes-item-title line-clamp-2",
                              itemSytles
                            )}
                          >
                            {post.title}
                          </span>
                        </ViewTransition>
                        {post.draft ? (
                          <Badge className="h-fit shrink-0" variant="secondary">
                            {t("draft")}
                          </Badge>
                        ) : (
                          <ViewTransition
                            name={`blog-date-${post.url.replaceAll("/", "-")}`}
                          >
                            <time
                              className="fieldnotes-item-date"
                              dateTime={post.published.toISOString()}
                            >
                              {formatPostDate(post.published, lang)}
                            </time>
                          </ViewTransition>
                        )}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))
      )}
    </div>
  );
}

function formatPostDate(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}
