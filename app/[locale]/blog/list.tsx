"use client";

import { ExternalLink } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { parseAsString, useQueryState } from "nuqs";

import { Badge } from "@/components/ui/badge";
import type { postMetadataType } from "@/shared/source";
import styles from "@/shared/styles/stagger-fade-in.module.css";
import { formatDate, formatYear } from "@/shared/utils/date";
import { cn } from "@/shared/utils/tailwind";

export function BlogList({
  lang,
  posts,
}: {
  lang: string;
  posts: postMetadataType[];
}) {
  const [query] = useQueryState("q", parseAsString.withDefault(""));
  return <BlogListFallback lang={lang} posts={posts} query={query} />;
}

export function BlogListFallback({
  posts,
  query,
  lang,
}: {
  posts: postMetadataType[];
  query: string | null;
  lang: string;
}) {
  // first filter by language metadata, then by title query
  const byLang = posts.filter((post) => post.lang.includes(lang));
  const filteredPosts = byLang.filter((post) =>
    post.title.toLowerCase().includes((query || "").toLowerCase())
  );
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
          <p>검색 결과가 없습니다 :/</p>
        </div>
      ) : (
        Object.keys(yearList)
          .reverse()
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
                          className={cn(itemSytles, "inline-flex items-center")}
                          href={post.external_url}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          <span
                            className={cn(
                              "inline box-decoration-clone px-1 py-1",
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
                          className={cn(itemSytles, "inline-flex items-center")}
                          href={post.url as Route}
                        >
                          <span
                            className={cn(
                              "inline box-decoration-clone px-1 py-1",
                              itemSytles
                            )}
                          >
                            {post.title}
                          </span>
                        </Link>
                      )}

                      {post.draft ? (
                        <Badge variant="secondary">Draft</Badge>
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
