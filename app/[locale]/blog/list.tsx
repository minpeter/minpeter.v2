"use client";

import Link from "next/link";
import { cn, formatDate, formatYear } from "@/lib/utils";
import { ExternalLink } from "lucide-react";

import { useQueryState, parseAsString } from "nuqs";
import { postMetadataType } from "@/lib/source";
import { Badge } from "@/components/ui/badge";

export function BlogList({
  lang,
  posts,
}: {
  lang: string;
  posts: postMetadataType[];
}) {
  const [query] = useQueryState(
    "q",
    parseAsString.withDefault(lang == "en" ? "(en)" : "")
  );

  return <BlogListFallback posts={posts} query={query} />;
}

export function BlogListFallback({
  posts,
  query,
}: {
  posts: postMetadataType[];
  query: string;
}) {
  const filteredPosts = posts.filter((post: postMetadataType) =>
    post.title?.toLowerCase().includes(query.toLowerCase())
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
    <div data-animate data-animate-speed="slow" className="group/list">
      {posts.length === 0 ? (
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
                <ul data-animate className="w-full space-y-3">
                  {yearList[year].map((post: postMetadataType) => (
                    <li
                      data-animate
                      key={post.url}
                      className="group/post flex justify-between space-x-4"
                    >
                      <Link
                        href={post.external_url ? post.external_url : post.url}
                        className={cn(
                          itemSytles,
                          "inline-flex items-center gap-1 px-2"
                        )}
                        target={post.external_url ? "_blank" : undefined}
                        rel={
                          post.external_url ? "noopener noreferrer" : undefined
                        }
                      >
                        <span className="inline box-decoration-clone py-1">
                          {post.title}
                        </span>
                        {post.external_url && (
                          <ExternalLink size={16} className="pb-1 opacity-60" />
                        )}
                      </Link>

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
