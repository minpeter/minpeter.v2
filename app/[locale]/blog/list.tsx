"use client";

import type { SortedResult } from "fumadocs-core/search";
import { useDocsSearch } from "fumadocs-core/search/client";
import { fetchClient } from "fumadocs-core/search/client/fetch";
import { Loader2, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { debounce, parseAsString, useQueryState } from "nuqs";
import type { ChangeEvent, ReactNode } from "react";
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";

import { limitBlogQuery, normalizeBlogQuery } from "@/shared/blog-search-query";
import type { postMetadataType } from "@/shared/source";

import { BlogListFallback } from "./list-fallback";
import { extractMatchedUrls, filterByTitle } from "./post-search";

type SearchOutcome =
  | {
      readonly data: SortedResult[];
      readonly kind: "success";
      readonly query: string;
    }
  | {
      readonly kind: "error";
      readonly query: string;
    };

/**
 * Client search island: owns the search input and URL `?q=` state.
 * When the query is empty, renders the server-provided static list (`children`).
 * When searching, replaces it with a filtered client list.
 */
export function BlogList({
  children,
  lang,
  posts,
}: {
  children: ReactNode;
  lang: string;
  posts: postMetadataType[];
}) {
  const t = useTranslations();
  const [isPending, startTransition] = useTransition();

  const [query, setQuery] = useQueryState(
    "q",
    parseAsString.withDefault("").withOptions({
      history: "replace",
      limitUrlUpdates: debounce(500),
      shallow: true,
      startTransition,
    })
  );
  const [inputQuery, setInputQuery] = useState(() => normalizeBlogQuery(query));
  const [searchOutcome, setSearchOutcome] = useState<SearchOutcome | null>(
    null
  );
  const expectedUrlQuery = useRef(normalizeBlogQuery(query));
  const searchRequestId = useRef(0);

  const normalizedQuery = useMemo(
    () => normalizeBlogQuery(inputQuery),
    [inputQuery]
  );
  const deferredQuery = useDeferredValue(normalizedQuery);

  const searchClient = useMemo(() => {
    const client = fetchClient({
      api: "/api/search",
      locale: lang,
    });

    return {
      ...client,
      async search(searchText: string) {
        const requestId = searchRequestId.current + 1;
        searchRequestId.current = requestId;
        try {
          const data = await client.search(searchText);
          if (requestId === searchRequestId.current) {
            setSearchOutcome({ data, kind: "success", query: searchText });
          }
          return data;
        } catch (error: unknown) {
          if (requestId === searchRequestId.current) {
            setSearchOutcome({ kind: "error", query: searchText });
          }
          throw error;
        }
      },
    };
  }, [lang]);

  const { setSearch, query: searchQuery } = useDocsSearch({
    client: searchClient,
  });

  useEffect(() => {
    setSearch(deferredQuery);
  }, [deferredQuery, setSearch]);

  useEffect(() => {
    const normalizedUrlQuery = normalizeBlogQuery(query);
    const isExternalQuery =
      normalizedUrlQuery !== expectedUrlQuery.current &&
      normalizedUrlQuery !== deferredQuery;
    if (isExternalQuery) {
      expectedUrlQuery.current = normalizedUrlQuery;
      setInputQuery(normalizedUrlQuery);
      return;
    }
    if (query !== deferredQuery) {
      expectedUrlQuery.current = deferredQuery;
      setQuery(deferredQuery || null);
    }
  }, [deferredQuery, query, setQuery]);

  const currentSearchOutcome =
    normalizedQuery === deferredQuery && searchOutcome?.query === deferredQuery
      ? searchOutcome
      : null;
  const isSearching =
    normalizedQuery !== deferredQuery ||
    isPending ||
    (Boolean(normalizedQuery) &&
      (currentSearchOutcome === null || searchQuery.isLoading));
  const hasSearchError =
    !searchQuery.isLoading && currentSearchOutcome?.kind === "error";

  const handleQueryChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const nextInputQuery = limitBlogQuery(event.target.value);
      setInputQuery(nextInputQuery);
    },
    []
  );
  const handleQueryClear = useCallback(() => {
    setInputQuery("");
  }, []);

  const filteredPosts = useMemo(() => {
    if (!normalizedQuery) {
      return null;
    }

    const byLang = posts.filter((post) => post.lang.includes(lang));

    if (currentSearchOutcome?.kind !== "success" || searchQuery.isLoading) {
      return filterByTitle(byLang, normalizedQuery);
    }

    const matchedUrls = extractMatchedUrls(currentSearchOutcome.data);
    const bySearchResult = byLang.filter((post) => matchedUrls.has(post.url));

    return bySearchResult.length === 0
      ? filterByTitle(byLang, normalizedQuery)
      : bySearchResult;
  }, [
    currentSearchOutcome,
    lang,
    normalizedQuery,
    posts,
    searchQuery.isLoading,
  ]);

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
          data-testid="blog-search"
          id="blog-search"
          onChange={handleQueryChange}
          placeholder={t("searchPlaceholder")}
          type="text"
          value={inputQuery}
        />
        {inputQuery ? (
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
        ) : null}
      </div>
      {hasSearchError ? (
        <p
          className="mt-3 px-1 text-muted-foreground text-sm [overflow-wrap:anywhere] [word-break:keep-all]"
          data-state="unavailable"
          data-testid="blog-search-status"
          role="status"
        >
          {t("searchUnavailableTitleFallback")}
        </p>
      ) : null}
      {filteredPosts ? (
        <BlogListFallback
          isLoading={isSearching}
          lang={lang}
          posts={filteredPosts}
        />
      ) : (
        children
      )}
    </>
  );
}
