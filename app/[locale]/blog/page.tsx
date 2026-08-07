import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { Suspense } from "react";

import { LanguageSelector } from "@/components/language-selector";
import { Link } from "@/shared/i18n/navigation";
import { blog, getPostsMetadata } from "@/shared/source";
import {
  createMetadata,
  getLocalizedPath,
  resolveLocale,
} from "@/shared/utils/metadata";

import { BlogList } from "./list";
import { BlogListFallback, BlogSearchShell } from "./list-fallback";
import { RssLink } from "./rss-link";

// Cache Components opt-out — remove after this route is adopted.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export async function generateMetadata(
  props: PageProps<"/[locale]/blog">
): Promise<Metadata> {
  const { locale: routeLocale } = await props.params;
  const locale = resolveLocale(routeLocale);
  const t = await getTranslations({ locale });
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

export default async function Page(props: PageProps<"/[locale]/blog">) {
  const { locale } = await props.params;

  const posts = getPostsMetadata(blog.getPages(locale));

  const t = await getTranslations();

  return (
    <section className="fieldnotes-page">
      <header className="fieldnotes-header">
        <nav aria-label={t("common.blogNavigation")} className="fieldnotes-nav">
          <Link
            aria-label={t("backToHome")}
            className="fieldnotes-logo-link"
            href="/"
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
      <Suspense
        fallback={
          <>
            <BlogSearchShell searchPlaceholder={t("searchPlaceholder")} />
            <BlogListFallback lang={locale} posts={posts} />
          </>
        }
      >
        <BlogList lang={locale} posts={posts} />
      </Suspense>
    </section>
  );
}
