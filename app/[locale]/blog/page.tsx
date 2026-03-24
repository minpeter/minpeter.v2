import type { Metadata, Route } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import Header from "@/components/header";
import { blog, getPostsMetadata } from "@/shared/source";
import styles from "@/shared/styles/stagger-fade-in.module.css";
import NewMetadata from "@/shared/utils/metadata";
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

export default async function Page(props: PageProps<"/[locale]/blog">) {
  const { locale } = await props.params;

  const posts = getPostsMetadata(blog.getPages(locale));

  const t = await getTranslations();

  return (
    <section className={styles.stagger_container}>
      <Header
        description={t("blogPageDescription")}
        link={{ href: `/${locale}` as Route, text: t("backToHome") }}
        rightContent={<RssLink locale={locale} />}
        title={t("blogPageTitle")}
      />
      <Suspense fallback={<BlogListFallback posts={posts} />}>
        <BlogList lang={locale} posts={posts} />
      </Suspense>
    </section>
  );
}
