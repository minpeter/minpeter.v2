import { ExternalLink, Search } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { ViewTransition } from "@/components/view-transition";
import type { postMetadataType } from "@/shared/source";
import styles from "@/shared/styles/stagger-fade-in.module.css";
import { formatPostDate, formatYear } from "@/shared/utils/date";
import { cn } from "@/shared/utils/tailwind";

// Shared by the external-link and internal-link branches of a list item.
const ITEM_LINK_CLASSNAME =
  "fieldnotes-item-link focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const ITEM_TITLE_CLASSNAME = "fieldnotes-item-title line-clamp-2";

export function BlogSearchShell({
  searchPlaceholder,
}: {
  searchPlaceholder: string;
}) {
  return (
    <div className="fieldnotes-search">
      <label className="sr-only" htmlFor="blog-search">
        {searchPlaceholder}
      </label>
      <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        autoComplete="off"
        className="w-full bg-transparent px-10 py-4 text-sm placeholder:text-muted-foreground focus:outline-none"
        data-testid="blog-search"
        id="blog-search"
        placeholder={searchPlaceholder}
        readOnly={true}
        type="text"
      />
    </div>
  );
}

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
                        className={ITEM_LINK_CLASSNAME}
                        href={post.external_url}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        <span className={ITEM_TITLE_CLASSNAME}>
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
                        className={ITEM_LINK_CLASSNAME}
                        href={post.url as Route}
                      >
                        <ViewTransition
                          name={`blog-title-${post.url.replaceAll("/", "-")}`}
                        >
                          <span className={ITEM_TITLE_CLASSNAME}>
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
