import type { Route } from "next";
import { Suspense } from "react";

import Header from "@/components/header";
import { blog, getPostsMetadata } from "@/shared/source";
import styles from "@/shared/styles/stagger-fade-in.module.css";
import NewMetadata from "@/shared/utils/metadata";

// import { BlogSearch, BlogSearchFallback } from "./search";

import { getTranslations } from "next-intl/server";
import { BlogList, BlogListFallback } from "./list";

export const metadata = NewMetadata({
  title: "minpeter | blog",
  description: "내가 적은 블로그, 너를 위해 써봤지",
});

export default async function Page(props: PageProps<"/[locale]/blog">) {
  const { locale } = await props.params;

  const posts = getPostsMetadata(blog.getPages(locale));

  const t = await getTranslations();

  return (
    <section className={styles.stagger_container}>
      <Header
        description={t("blogPageDescription")}
        link={{ href: `/${locale}` as Route, text: t("backToHome") }}
        title={t("blogPageTitle")}
      />
      {/* FIXME: node:fs
Module build failed: UnhandledSchemeError: Reading from "node:fs" is not handled by plugins (Unhandled scheme).
Webpack supports "data:" and "file:" URIs by default. */}
      {/* <Suspense fallback={<BlogSearchFallback />}>
        <BlogSearch lang={locale} />
      </Suspense> */}
      <Suspense fallback={<BlogListFallback posts={posts} />}>
        <BlogList lang={locale} posts={posts} />
      </Suspense>
    </section>
  );
}
