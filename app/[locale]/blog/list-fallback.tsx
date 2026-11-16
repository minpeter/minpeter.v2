import { Search } from "lucide-react";
import { useTranslations } from "next-intl";

import { PostRow } from "@/components/post-row";
import type { postMetadataType } from "@/shared/source";
import { formatYear } from "@/shared/utils/date";

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
      <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
      <input
        autoComplete="off"
        className="placeholder:text-muted-foreground w-full bg-transparent px-10 py-4 text-sm focus:outline-none"
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
  posts,
}: {
  isLoading?: boolean;
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
    <div aria-busy={isLoading || undefined} className="fieldnotes-list">
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
              <ul className="post-rows">
                {yearList[year].map((post: postMetadataType) => (
                  <li key={post.url}>
                    <PostRow draftLabel={t("draft")} post={post} />
                  </li>
                ))}
              </ul>
            </section>
          ))
      )}
    </div>
  );
}
