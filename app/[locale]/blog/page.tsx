import type { Metadata } from "next";
import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { LanguageSelector } from "@/components/language-selector";
import { getCachedPostsForLocale } from "@/shared/blog-cache";
import { Link } from "@/shared/i18n/navigation";
import { createMetadata, getLocalizedPath } from "@/shared/utils/metadata";

import { BlogList } from "./list";
import { BlogListFallback, BlogSearchShell } from "./list-fallback";
import { RssLink } from "./rss-link";

export async function generateMetadata(): Promise<Metadata> {
  const [locale, t] = await Promise.all([getLocale(), getTranslations()]);
  const baseMetadata = createMetadata({
    description: t("blogPageDescription"),
    locale,
    path: "/blog",
    title: `minpeter | ${t("blogPageTitle")}`,
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
  // Cached list — fills App Shell / runtime prefetch without re-reading the source tree.
  const posts = await getCachedPostsForLocale(locale);

  return (
    <section className="fieldnotes-page" data-testid="blog-list-shell">
      <header className="fieldnotes-header">
        <nav aria-label={t("common.blogNavigation")} className="fieldnotes-nav">
          <Link
            aria-label={t("backToHome")}
            className="fieldnotes-logo-link"
            href="/"
            prefetch={true}
          >
            <Image
              alt=""
              aria-hidden="true"
              className="fieldnotes-logo"
              height={32}
              priority
              src="/assets/signature-mark.svg"
              width={32}
            />
          </Link>
          <div className="fieldnotes-nav-tools">
            <RssLink locale={locale} />
            <span aria-hidden="true">·</span>
            <Suspense fallback={null}>
              <LanguageSelector />
            </Suspense>
          </div>
        </nav>
      </header>
      {/*
        Soft-nav / streaming shell: header + search placeholder + full post list.
        After hydrate, BlogList keeps the server list (children) until ?q= is set.
      */}
      <Suspense
        fallback={
          <>
            <BlogSearchShell searchPlaceholder={t("searchPlaceholder")} />
            <BlogListFallback lang={locale} posts={posts} />
          </>
        }
      >
        <BlogList lang={locale} posts={posts}>
          <BlogListFallback lang={locale} posts={posts} />
        </BlogList>
      </Suspense>
    </section>
  );
}
