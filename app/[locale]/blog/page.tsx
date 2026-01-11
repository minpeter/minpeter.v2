import type { Metadata, Route } from "next";
import { createLoader, parseAsString } from "nuqs/server";
import { Suspense } from "react";

import Header from "@/components/header";
import { blog, getPostsMetadata } from "@/shared/source";
import styles from "@/shared/styles/stagger-fade-in.module.css";
import NewMetadata from "@/shared/utils/metadata";

// import { BlogSearch, BlogSearchFallback } from "./search";

import { getTranslations } from "next-intl/server";
import { BlogList, BlogListFallback } from "./list";
import { RssLink } from "./rss-link";

export async function generateMetadata(
  props: PageProps<"/[locale]/blog">
): Promise<Metadata> {
  const { locale } = await props.params;
  const baseMetadata = NewMetadata({
    title: "minpeter | blog",
    description: "내가 적은 블로그, 너를 위해 써봤지",
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

const blogSearchParams = {
  q: parseAsString.withDefault(""),
};

const loadSearchParams = createLoader(blogSearchParams);

export default async function Page(props: PageProps<"/[locale]/blog">) {
  const { locale } = await props.params;
  const { q: query } = loadSearchParams(await props.searchParams);

  const posts = getPostsMetadata(blog.getPages(locale));

  const t = await getTranslations();

  return (
    <section className={styles.stagger_container}>
      <Header
        description={t("blogPageDescription")}
        link={{ href: `/${locale}` as Route, text: t("backToHome") }}
        title={t("blogPageTitle")}
      />
      <div className="-mt-8 mb-4 flex justify-end">
        <RssLink locale={locale} />
      </div>
      {/* FIXME: node:fs
Module build failed: UnhandledSchemeError: Reading from "node:fs" is not handled by plugins (Unhandled scheme).
Webpack supports "data:" and "file:" URIs by default. */}
      {/* <Suspense fallback={<BlogSearchFallback />}>
        <BlogSearch lang={locale} />
      </Suspense> */}
      <Suspense
        fallback={
          <BlogListFallback lang={locale} posts={posts} query={query} />
        }
      >
        <BlogList lang={locale} posts={posts} />
      </Suspense>
    </section>
  );
}
