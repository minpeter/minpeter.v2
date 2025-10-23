import type { Route } from "next";
import { setStaticParamsLocale } from "next-international/server";
import { createLoader, parseAsString, SearchParams } from "nuqs/server";
import { Suspense } from "react";

import Header from "@/components/header";
import { blog, getPostsMetadata } from "@/lib/source";
import styles from "@/lib/styles/stagger-fade-in.module.css";
import NewMetadata from "@/lib/utils/metadata";
import { getI18n } from "@/locales/server";

// import { BlogSearch, BlogSearchFallback } from "./search";

import { BlogList, BlogListFallback } from "./list";

export const metadata = NewMetadata({
  title: "minpeter | blog",
  description: "내가 적은 블로그, 너를 위해 써봤지",
});

const blogSearchParams = {
  q: parseAsString.withDefault(""),
};

const loadSearchParams = createLoader(blogSearchParams);

export default async function Page(props: PageProps<"/[locale]/blog">) {
  const { locale } = await props.params;
  const { q: query } = loadSearchParams(await props.searchParams);

  const posts = getPostsMetadata(blog.getPages(locale));

  setStaticParamsLocale(locale);
  const t = await getI18n();

  return (
    <section className={styles.stagger_container}>
      <Header
        title={t("blogPageTitle")}
        description={t("blogPageDescription")}
        link={{ href: `/${locale}` as Route, text: t("backToHome") }}
      />
      {/* FIXME: node:fs
Module build failed: UnhandledSchemeError: Reading from "node:fs" is not handled by plugins (Unhandled scheme).
Webpack supports "data:" and "file:" URIs by default. */}
      {/* <Suspense fallback={<BlogSearchFallback />}>
        <BlogSearch lang={locale} />
      </Suspense> */}
      <Suspense
        fallback={
          <BlogListFallback query={query} posts={posts} lang={locale} />
        }
      >
        <BlogList posts={posts} lang={locale} />
      </Suspense>
    </section>
  );
}
