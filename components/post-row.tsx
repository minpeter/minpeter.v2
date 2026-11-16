import { ExternalLink } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { ViewTransition } from "@/components/view-transition";
import type { postMetadataType } from "@/shared/source";
import { formatDateLong } from "@/shared/utils/date";

const transitionName = (part: "date" | "title", url: string) =>
  `blog-${part}-${url.replaceAll("/", "-")}`;

/**
 * One post in a list: title on the left, date (or the draft badge) on the
 * right. Shared by the blog index and the home page so both read as one list.
 */
export function PostRow({
  draftLabel,
  post,
  showDescription = false,
  testId = "blog-post-link",
}: {
  draftLabel: string;
  post: postMetadataType;
  /** Adds the post's one-line summary; meant for short lists. */
  showDescription?: boolean;
  /** The blog index owns the default id; other lists name their own rows. */
  testId?: string;
}) {
  const isExternal = Boolean(post.external_url);
  const description =
    showDescription && post.description ? (
      <span className="post-row-description">{post.description}</span>
    ) : null;
  const title = (
    <span className="post-row-title line-clamp-2">
      {post.title}
      {isExternal ? (
        <ExternalLink
          aria-hidden="true"
          className="ml-1 inline-block pb-1 opacity-60"
          size={16}
        />
      ) : null}
    </span>
  );
  const meta = post.draft ? (
    <Badge className="h-fit shrink-0" variant="secondary">
      {draftLabel}
    </Badge>
  ) : (
    <time className="post-row-date" dateTime={post.published.toISOString()}>
      {formatDateLong(post.published)}
    </time>
  );

  if (post.external_url) {
    return (
      <a
        className="post-row"
        href={post.external_url}
        rel="noopener noreferrer"
        target="_blank"
      >
        <span className="post-row-text">
          {title}
          {description}
        </span>
        {meta}
      </a>
    );
  }

  return (
    <Link className="post-row" data-testid={testId} href={post.url as Route}>
      <span className="post-row-text">
        <ViewTransition name={transitionName("title", post.url)}>
          {title}
        </ViewTransition>
        {description}
      </span>
      <ViewTransition name={transitionName("date", post.url)}>
        {meta}
      </ViewTransition>
    </Link>
  );
}
