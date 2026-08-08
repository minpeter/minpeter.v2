import { DocsBody } from "fumadocs-ui/page";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";

import ExternalRedirect from "@/components/external-redirect";
import Header from "@/components/header";
import { MachineTranslationNotice } from "@/components/machine-translation-notice";
import { siteConfig } from "@/shared/site-config";
import { blog } from "@/shared/source";
import styles from "@/shared/styles/stagger-fade-in.module.css";
import { formatDateLong } from "@/shared/utils/date";
import { createMetadata, getLocalizedPath } from "@/shared/utils/metadata";
import { cn } from "@/shared/utils/tailwind";

import Loading from "./loading";
import { createBlogMdxComponents } from "./mdx-components";
import { PostFooter } from "./post-footer";
import { PostToc } from "./post-toc";

export function generateStaticParams({
  params,
}: {
  params: { locale: string; slug: string[] };
}) {
  const { locale } = params;
  const pages = blog.getPages(locale);
  return pages.map((page) => ({ slug: page.slugs }));
}

export async function generateMetadata(
  props: PageProps<"/[locale]/blog/[...slug]">
) {
  const { slug } = await props.params;
  const [locale, t] = await Promise.all([getLocale(), getTranslations()]);
  const page = blog.getPage(slug, locale);
  if (!page) {
    return createMetadata({
      description: t("notFound.description"),
      image: {
        alt: "minpeter | 404",
        url: getLocalizedPath(locale, "/og/not-found"),
      },
      locale,
      title: "minpeter | 404",
    });
  }

  const slugPath = slug.join("/");
  const title = page.data.title ?? siteConfig.title;

  return createMetadata({
    article: {
      authors: [siteConfig.author],
      modifiedTime: page.data.lastModified
        ? new Date(page.data.lastModified).toISOString()
        : undefined,
      publishedTime: new Date(page.data.published).toISOString(),
    },
    description: page.data.description,
    image: {
      alt: title,
      url: getLocalizedPath(locale, `/blog/og/${slugPath}`),
    },
    locale,
    path: `/blog/${slugPath}`,
    title,
  });
}

/**
 * Exported for unit tests; page wraps this in Suspense for the soft-nav shell.
 *
 * Note: do not wrap the full MDX tree in `"use cache"`. Caching RSC that
 * includes MDX + client islands (Header, etc.) can corrupt the Flight stream
 * in dev ("Cannot write to a CLOSED writable stream"). List/metadata stay
 * cached via `shared/blog-cache.ts` instead.
 */
export async function PostBody({
  params,
}: {
  params: Promise<{ locale: string; slug: string[] }>;
}) {
  const { locale: routeLocale, slug } = await params;
  const locale = (await getLocale()) || routeLocale;
  const post = blog.getPage(slug, locale);

  if (!post) {
    notFound();
  }

  const t = await getTranslations();

  if (post.data.external_url) {
    return (
      <section
        className={cn(
          styles.stagger_container,
          styles.post,
          "blog-post-page flex flex-1 flex-col"
        )}
        data-testid="blog-post-shell"
      >
        <Header
          link={{ href: "/blog", text: t("backToBlog") }}
          title={post.data.title}
        />
        <ExternalRedirect url={post.data.external_url} />
      </section>
    );
  }

  const MDX = post.data.body;
  const blogMdxComponents = createBlogMdxComponents();

  return (
    <section
      className={cn(styles.stagger_container, styles.post, "blog-post-page")}
      data-testid="blog-post-shell"
    >
      <Header
        description={formatDateLong(post.data.published)}
        link={{ href: "/blog", text: t("backToBlog") }}
        title={post.data.title}
        titleTransitionName={`blog-title-${post.url.replaceAll("/", "-")}`}
      />

      {post.data.machine_translated || post.data.ai_generated_by ? (
        <MachineTranslationNotice
          className="mb-6"
          generatedBy={post.data.ai_generated_by}
        />
      ) : null}

      <PostToc toc={post.data.toc} />
      <DocsBody>
        <div
          className="[&_a]:[overflow-wrap:anywhere] [&_code]:[overflow-wrap:anywhere] [&_kbd]:[overflow-wrap:anywhere] [&_samp]:[overflow-wrap:anywhere]"
          data-blog-body=""
          data-testid="blog-post-content"
          lang={locale}
          style={{
            overflowWrap: "break-word",
            wordBreak: "keep-all",
          }}
        >
          <MDX className="mdx" components={blogMdxComponents} />
        </div>
      </DocsBody>

      <PostFooter
        labels={{
          draft: t("draft"),
          draftedDate: t("draftedDate"),
          lastModifiedDate: t("lastModifiedDate"),
          publishedDate: t("publishedDate"),
        }}
        locale={locale}
        post={post}
      />
    </section>
  );
}

export default function Page(props: PageProps<"/[locale]/blog/[...slug]">) {
  // Keep the segment shell (loading.tsx) instant; stream URL-specific post body.
  return (
    <Suspense fallback={<Loading />}>
      <PostBody params={props.params} />
    </Suspense>
  );
}
