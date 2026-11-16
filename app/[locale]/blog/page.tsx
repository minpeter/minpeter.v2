import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { SiteNav } from "@/components/site-nav";
import { type AppLocale, getCachedPostsForLocale } from "@/shared/source";
import {
  createMetadata,
  createSectionImage,
  getLocalizedPath,
} from "@/shared/utils/metadata";

import { BlogList } from "./list";
import { BlogListFallback, BlogSearchShell } from "./list-fallback";
import { RssLink } from "./rss-link";

export async function generateMetadata(): Promise<Metadata> {
  const [locale, t] = await Promise.all([getLocale(), getTranslations()]);
  const title = `minpeter | ${t("blogPageTitle")}`;
  const baseMetadata = createMetadata({
    description: t("blogPageDescription"),
    image: createSectionImage(locale, "/blog", title),
    locale,
    path: "/blog",
    title,
  });

  return {
    ...baseMetadata,
    alternates: {
      ...baseMetadata.alternates,
      types: {
        "application/rss+xml": getLocalizedPath(locale, "/blog/rss.xml"),
      },
    },
  };
}

export default async function Page() {
  const [locale, t] = await Promise.all([getLocale(), getTranslations()]);
  const posts = await getCachedPostsForLocale(locale as AppLocale);

  return (
    <section
      className="site-page fieldnotes-page"
      data-testid="blog-list-shell"
    >
      <header className="fieldnotes-header">
        <SiteNav
          home={{ href: "/", label: t("backToHome") }}
          navigationLabel={t("common.blogNavigation")}
          tools={<RssLink locale={locale} />}
        />
      </header>
      {/*
        Soft-nav / streaming shell: header + search placeholder + full post list.
        After hydrate, BlogList keeps the server list (children) until ?q= is set.
      */}
      <Suspense
        fallback={
          <>
            <BlogSearchShell searchPlaceholder={t("searchPlaceholder")} />
            <BlogListFallback posts={posts} />
          </>
        }
      >
        <BlogList lang={locale} posts={posts}>
          <BlogListFallback posts={posts} />
        </BlogList>
      </Suspense>
    </section>
  );
}
