import type { Metadata, Route } from "next";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

import { LanguageSelector } from "@/components/language-selector";
import { blog, getPostsMetadata } from "@/shared/source";
import NewMetadata from "@/shared/utils/metadata";

import { BlogList, BlogListFallback } from "./list";
import { RssLink } from "./rss-link";

export async function generateMetadata(
  props: PageProps<"/[locale]/blog">
): Promise<Metadata> {
  const { locale } = await props.params;
  const baseMetadata = NewMetadata({
    description: "내가 적은 블로그, 너를 위해 써봤지",
    title: "minpeter | blog",
  });

  return {
    ...baseMetadata,
    alternates: {
      types: {
        "application/rss+xml": `/${locale}/blog/rss.xml`,
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
        <nav aria-label="Blog navigation" className="fieldnotes-nav">
          <Link
            aria-label={t("backToHome")}
            className="fieldnotes-logo-link"
            href={`/${locale}` as Route}
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
            <LanguageSelector />
          </div>
        </nav>
      </header>
      <Suspense fallback={<BlogListFallback lang={locale} posts={posts} />}>
        <BlogList lang={locale} posts={posts} />
      </Suspense>
    </section>
  );
}
