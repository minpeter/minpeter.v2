import { getLocale, getTranslations } from "next-intl/server";

import { PostRow } from "@/components/post-row";
import { Link } from "@/shared/i18n/navigation";
import { type AppLocale, getCachedPostsForLocale } from "@/shared/source";

const RECENT_POST_COUNT = 3;

/** The newest published posts, so the home page shows writing, not only doors. */
export async function RecentPosts() {
  const [locale, t] = await Promise.all([getLocale(), getTranslations()]);
  const posts = (await getCachedPostsForLocale(locale as AppLocale))
    .filter((post) => !post.draft)
    .slice(0, RECENT_POST_COUNT);

  if (posts.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="recent-title" className="mt-16">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="home-section-label" id="recent-title">
          {t("home.recentTitle")}
        </h2>
        <Link
          className="home-more-link tap-target"
          data-testid="home-all-posts"
          href="/blog"
        >
          {t("home.allPosts")} <span aria-hidden="true">→</span>
        </Link>
      </div>
      <ul className="post-rows post-rows-flush" data-testid="home-recent-posts">
        {posts.map((post) => (
          <li key={post.url}>
            <PostRow
              draftLabel={t("draft")}
              post={post}
              showDescription
              testId="home-post-link"
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
