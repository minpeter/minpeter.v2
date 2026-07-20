"use client";

import { useDocsSearch } from "fumadocs-core/search/client";
import { Loader2, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { debounce, parseAsString, useQueryState } from "nuqs";
import { useCallback, useDeferredValue, useEffect, useTransition } from "react";
import type { ChangeEvent } from "react";

import type { postMetadataType } from "@/shared/source";

import { BlogListFallback } from "./list-fallback";
import { extractMatchedUrls, filterByTitle } from "./post-search";

export function BlogList({
  lang,
  posts,
}: {
  lang: string;
  posts: postMetadataType[];
}) {
  const t = useTranslations();
  const [isPending, startTransition] = useTransition();

  const [query, setQuery] = useQueryState(
    "q",
    parseAsString.withDefault("").withOptions({
      limitUrlUpdates: debounce(500),
      shallow: false,
      startTransition,
    })
  );

  const deferredQuery = useDeferredValue(query);

  const { setSearch, query: searchQuery } = useDocsSearch({
    api: "/api/search",
    locale: lang,
    type: "fetch",
  });

  useEffect(() => {
    setSearch(deferredQuery);
  }, [deferredQuery, setSearch]);

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
                aria-label={t("common.clearSearch")}
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
      <BlogListFallback
        isLoading={isSearching}
        lang={lang}
        posts={filteredPosts}
      />
    </>
  );
}
