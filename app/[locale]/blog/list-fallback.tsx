import { ExternalLink } from "lucide-react";
import type { Route } from "next";
import { useTranslations } from "next-intl";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { ViewTransition } from "@/components/view-transition";
import type { postMetadataType } from "@/shared/source";
import styles from "@/shared/styles/stagger-fade-in.module.css";
import { formatPostDate, formatYear } from "@/shared/utils/date";
import { cn } from "@/shared/utils/tailwind";

export function BlogListFallback({
  isLoading = false,
  lang = "en",
  posts,
}: {
  isLoading?: boolean;
  lang?: string;
  posts: postMetadataType[];
}) {
  const t = useTranslations();
  const yearList = posts.reduce(
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

  const itemStyles = "transition-opacity duration-200";

  return (
    <div
      aria-busy={isLoading || undefined}
      className={cn(styles.stagger_container, styles.slow, "fieldnotes-list")}
    >
      {posts.length === 0 ? (
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
                          itemStyles,
                          "fieldnotes-item-link focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        )}
                        href={post.external_url}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        <span
                          className={cn(
                            "fieldnotes-item-title line-clamp-2",
                            itemStyles
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
                          itemStyles,
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
                              itemStyles
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
