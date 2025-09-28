"use client";

import { ExternalLink } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useQueryState, parseAsString } from "nuqs";

import { Badge } from "@/components/ui/badge";
import { postMetadataType } from "@/lib/source";
import styles from "@/lib/styles/stagger-fade-in.module.css";
import { formatDate, formatYear } from "@/lib/utils/date";
import { cn } from "@/lib/utils/tailwind";

export function BlogList({
  lang,
  posts,
}: {
  lang: string;
  posts: postMetadataType[];
}) {
  const [query] = useQueryState("q", parseAsString.withDefault(""));
  return <BlogListFallback posts={posts} query={query} lang={lang} />;
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
              key={year}
              className="group/year flex flex-col gap-2 border-t py-8 last-of-type:border-b sm:flex-row"
            >
              <div className="w-24">
                <h2 className="group-hover/year:bg-secondary/100 w-fit rounded-md px-2 opacity-60">
                  {year}
                </h2>
              </div>
              {
                <ul
                  className={cn(styles.stagger_container, "w-full space-y-3")}
                >
                  {yearList[year].map((post: postMetadataType) => (
                    <li
                      key={post.url}
                      className="group/post flex justify-between space-x-4"
                    >
                      {post.external_url ? (
                        <a
                          href={post.external_url}
                          className={cn(itemSytles, "inline-flex items-center")}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <span
                            className={cn(
                              "inline box-decoration-clone px-1 py-1",
                              itemSytles
                            )}
                          >
                            {post.title}
                            <ExternalLink
                              size={16}
                              className="ml-1 inline-block pb-1 opacity-60"
                            />
                          </span>
                        </a>
                      ) : (
                        <Link
                          href={post.url as Route}
                          className={cn(itemSytles, "inline-flex items-center")}
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
