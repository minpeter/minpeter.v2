import Header from "@/components/header";
import { Suspense } from "react";
import { BlogList, BlogListFallback } from "./list";

import NewMetadata from "@/lib/metadata";
import { getI18n } from "@/locales/server";
import { setStaticParamsLocale } from "next-international/server";
// import { BlogSearch, BlogSearchFallback } from "./search";
import { createLoader, parseAsString, SearchParams } from "nuqs/server";
import { blog, getPostsMetadata } from "@/lib/source";
import type { Route } from "next";

export const metadata = NewMetadata({
  title: "minpeter | blog",
  description: "내가 적은 블로그, 너를 위해 써봤지",
});

const blogSearchParams = {
  q: parseAsString.withDefault(""),
};

const loadSearchParams = createLoader(blogSearchParams);

export default async function Page({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams: SearchParams;
}) {
  const { locale } = params;
  const { q: query } = await loadSearchParams(searchParams);

  const posts = getPostsMetadata(blog.getPages(locale));

  setStaticParamsLocale(locale);
  const t = await getI18n();

  return (
    <section data-animate>
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
