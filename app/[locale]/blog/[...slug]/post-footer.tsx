import type { Route } from "next";
import { getTranslations } from "next-intl/server";

import { ViewTransition } from "@/components/view-transition";
import { blog } from "@/shared/source";
import type { blogType } from "@/shared/source";
import { formatDateLong } from "@/shared/utils/date";

import { NavLink } from "./nav-link";
import { getAdjacentPosts } from "./post-navigation";

export async function PostFooter({
  locale,
  post,
}: {
  locale: string;
  post: NonNullable<blogType>;
}) {
  const posts = blog.getPages(locale);
  const t = await getTranslations();
  const { nextPost, previousPost } = getAdjacentPosts(
    posts,
    post.slugs.join("/")
  );

  return (
<section className="mt-32">
        <div className="mb-8 flex flex-row flex-wrap items-center gap-2 text-muted-foreground text-sm">
          {post.data.drafted ? (
            <>
              <div className="flex gap-2">
                <span>{t("draftedDate")}:</span>
                <time dateTime={new Date(post.data.drafted).toISOString()}>
                  {formatDateLong(post.data.drafted)}
                </time>
              </div>
              <span aria-hidden="true">•</span>
            </>
          ) : null}

          <div className="flex gap-2">
            <span>{t("publishedDate")}:</span>
            <ViewTransition name={`blog-date-${post.url.replaceAll("/", "-")}`}>
              <time dateTime={new Date(post.data.published).toISOString()}>
                {formatDateLong(post.data.published)}
              </time>
            </ViewTransition>
          </div>

          {post.data.lastModified ? <span aria-hidden="true">•</span> : null}

          {post.data.lastModified ? (
            <div className="flex gap-2">
              <span>{t("lastModifiedDate")}:</span>
              <time dateTime={new Date(post.data.lastModified).toISOString()}>
                {formatDateLong(post.data.lastModified)}
              </time>
            </div>
          ) : null}

          {post.data.draft ? <span aria-hidden="true">•</span> : null}

          {post.data.draft ? <span>{t("draft")}</span> : null}
        </div>

        <hr className="my-8" />
        <div className="flex justify-between">
          {previousPost ? (
            <NavLink
              className="max-w-[45%] truncate rounded-md px-2 py-1 text-primary hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
              className="max-w-[45%] truncate rounded-md px-2 py-1 text-primary hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
