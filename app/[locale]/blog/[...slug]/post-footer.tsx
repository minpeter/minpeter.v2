import type { Route } from "next";

import { ViewTransition } from "@/components/view-transition";
import type { blogType } from "@/shared/source";
import { getLocalizedPosts } from "@/shared/source";
import { formatDateLong } from "@/shared/utils/date";

import { NavLink } from "./nav-link";
import { getAdjacentPosts } from "./post-navigation";

interface PostFooterLabels {
  draft: string;
  draftedDate: string;
  lastModifiedDate: string;
  publishedDate: string;
}

export function PostFooter({
  locale,
  post,
  labels,
}: {
  locale: string;
  post: NonNullable<blogType>;
  labels: PostFooterLabels;
}) {
  // Prev/next stay within this locale's real editions.
  const posts = getLocalizedPosts(locale);
  const { nextPost, previousPost } = getAdjacentPosts(
    posts,
    post.slugs.join("/")
  );

  return (
    <section className="mt-32">
      <div className="text-foreground/88 mb-8 flex flex-row flex-wrap items-center gap-2 text-sm">
        {post.data.drafted ? (
          <>
            <div className="flex gap-2">
              <span>{labels.draftedDate}:</span>
              <time dateTime={new Date(post.data.drafted).toISOString()}>
                {formatDateLong(post.data.drafted)}
              </time>
            </div>
            <span aria-hidden="true">•</span>
          </>
        ) : null}

        <div className="flex gap-2">
          <span>{labels.publishedDate}:</span>
          <ViewTransition name={`blog-date-${post.url.replaceAll("/", "-")}`}>
            <time dateTime={new Date(post.data.published).toISOString()}>
              {formatDateLong(post.data.published)}
            </time>
          </ViewTransition>
        </div>

        {post.data.lastModified ? <span aria-hidden="true">•</span> : null}

        {post.data.lastModified ? (
          <div className="flex gap-2">
            <span>{labels.lastModifiedDate}:</span>
            <time dateTime={new Date(post.data.lastModified).toISOString()}>
              {formatDateLong(post.data.lastModified)}
            </time>
          </div>
        ) : null}

        {post.data.draft ? <span aria-hidden="true">•</span> : null}

        {post.data.draft ? <span>{labels.draft}</span> : null}
      </div>

      <hr className="my-8" />
      <div className="flex justify-between">
        {previousPost ? (
          <NavLink
            className="text-primary hover:bg-secondary focus-visible:ring-ring max-w-[45%] truncate rounded-md px-2 py-1 focus-visible:ring-2 focus-visible:outline-none"
            href={previousPost.url as Route}
            transitionTypes={["slide-back"]}
          >
            ← {previousPost.data.title}
          </NavLink>
        ) : (
          <div />
        )}

        {nextPost ? (
          <NavLink
            className="text-primary hover:bg-secondary focus-visible:ring-ring max-w-[45%] truncate rounded-md px-2 py-1 focus-visible:ring-2 focus-visible:outline-none"
            href={nextPost.url as Route}
            transitionTypes={["slide-forward"]}
          >
            {nextPost.data.title} →
          </NavLink>
        ) : null}
      </div>
    </section>
  );
}
