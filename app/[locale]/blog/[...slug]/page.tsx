import type { TOCItemType } from "fumadocs-core/toc";
import { Callout } from "fumadocs-ui/components/callout";
import { ImageZoom } from "fumadocs-ui/components/image-zoom";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import defaultMdxComponents from "fumadocs-ui/mdx";
import { DocsBody } from "fumadocs-ui/page";
import type { Route } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ComponentProps, ReactNode } from "react";
import { isValidElement } from "react";

import ExternalRedirect from "@/components/external-redirect";
import Header from "@/components/header";
import { MachineTranslationNotice } from "@/components/machine-translation-notice";
import { MediaGrid } from "@/components/media-grid";
import { ViewTransition } from "@/components/view-transition";
import { siteConfig } from "@/shared/site-config";
import { blog } from "@/shared/source";
import { formatDateLong } from "@/shared/utils/date";
import {
  createMetadata,
  getLocalizedPath,
  resolveLocale,
} from "@/shared/utils/metadata";
import { cn } from "@/shared/utils/tailwind";

import { NavLink } from "./nav-link";

import styles from "@/shared/styles/stagger-fade-in.module.css";

export const dynamicParams = false;

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
  const { locale: rawLocale, slug } = await props.params;
  const locale = resolveLocale(rawLocale);
  const page = blog.getPage(slug, locale);
  if (!page) {
    return createMetadata({
      description: "Page not found :/",
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

export default async function Page(
  props: PageProps<"/[locale]/blog/[...slug]">
) {
  const { locale, slug } = await props.params;
  const post = blog.getPage(slug, locale);

  if (!post) {
    notFound();
  }

  if (post?.data.external_url) {
    return <ExternalRedirect url={post.data.external_url} />;
  }

  const [posts, t] = [blog.getPages(locale), await getTranslations()];
  const internalPosts = posts.filter((item) => !item.data.external_url);
  const sortedPosts = internalPosts.toSorted(
    (a, b) =>
      new Date(b.data.published).getTime() -
      new Date(a.data.published).getTime()
  );

  const MDX = post.data.body;

  const currentPostPath = post.slugs.join("/");
  const currentPostIndex = sortedPosts.findIndex(
    (item) => item.slugs.join("/") === currentPostPath
  );
  const previousPost =
    currentPostIndex > 0 ? sortedPosts[currentPostIndex - 1] : null;
  const nextPost =
    currentPostIndex === -1 ? null : sortedPosts[currentPostIndex + 1];

  return (
    <section className={cn(styles.stagger_container, "blog-post-page")}>
      <Header
        description={formatDateLong(post.data.published)}
        link={{ href: `/${locale}/blog` as Route, text: t("backToBlog") }}
        title={post.data.title}
        titleTransitionName={`blog-title-${post.url.replaceAll("/", "-")}`}
      />

      {(post.data.machine_translated || post.data.ai_generated_by) && (
        <MachineTranslationNotice
          className="mb-6"
          generatedBy={post.data.ai_generated_by}
        />
      )}

      <aside className="fixed top-36 left-8 hidden w-72 2xl:block">
        {post.data.toc.length > 0 && (
          <div className="text-sm">
            <nav className={styles.stagger_container}>
              {post.data.toc.map((item: TOCItemType) => (
                <a
                  className={cn(
                    "my-1 block",
                    "animation:enter w-fit rounded-md px-0.5 hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    "box-decoration-clone px-2 py-1"
                  )}
                  href={item.url}
                  key={item.url}
                  style={{ marginLeft: `${(item.depth - 1) * 1}rem` }}
                >
                  {isValidElement<{ children: ReactNode }>(item.title)
                    ? item.title.props.children
                    : item.title}
                </a>
              ))}
            </nav>
          </div>
        )}
      </aside>
      <DocsBody>
        <div
          className="[&_a]:[overflow-wrap:anywhere] [&_code]:[overflow-wrap:anywhere] [&_kbd]:[overflow-wrap:anywhere] [&_samp]:[overflow-wrap:anywhere]"
          data-blog-body=""
          lang={locale}
          style={{
            overflowWrap: "break-word",
            wordBreak: "keep-all",
          }}
        >
          <MDX
            className="mdx"
            components={{
              ...defaultMdxComponents,
              Callout,
              MediaGrid,
              Tab,
              Tabs,
              a: (anchorProps) => {
                const { href, children, ...rest } = anchorProps;
                const h = href as string | undefined;
                const isInternalLink =
                  h?.startsWith("/") && !h?.startsWith("//");
                if (isInternalLink) {
                  return (
                    <Link
                      className="rounded-md px-2 py-1 text-primary hover:bg-secondary"
                      href={h as Route}
                      {...(rest as Record<string, unknown>)}
                    >
                      {children}
                    </Link>
                  );
                }
                return (
                  <a
                    className="rounded-md px-2 py-1 text-primary hover:bg-secondary"
                    href={h}
                    rel="noopener noreferrer"
                    target="_blank"
                    {...rest}
                  >
                    {children}
                  </a>
                );
              },
              img: (imageProps) => (
                <ImageZoom
                  {...(imageProps as ComponentProps<typeof ImageZoom>)}
                />
              ),
            }}
          />
        </div>
      </DocsBody>

      <section className="mt-32">
        <div className="mb-8 flex flex-row flex-wrap items-center gap-2 text-muted-foreground text-sm">
          {post.data.drafted ? (
            <>
              <div className="flex gap-2">
                <span>{t("draftedDate")}:</span>
                <time dateTime={new Date(post.data.drafted).toISOString()}>
                  {formatDateLong(post.data.drafted)}
                </time>
              </div>
              <span aria-hidden="true">•</span>
            </>
          ) : null}

          <div className="flex gap-2">
            <span>{t("publishedDate")}:</span>
            <ViewTransition name={`blog-date-${post.url.replaceAll("/", "-")}`}>
              <time dateTime={new Date(post.data.published).toISOString()}>
                {formatDateLong(post.data.published)}
              </time>
            </ViewTransition>
          </div>

          {post.data.lastModified ? <span aria-hidden="true">•</span> : null}

          {post.data.lastModified ? (
            <div className="flex gap-2">
              <span>{t("lastModifiedDate")}:</span>
              <time dateTime={new Date(post.data.lastModified).toISOString()}>
                {formatDateLong(post.data.lastModified)}
              </time>
            </div>
          ) : null}

          {post.data.draft ? <span aria-hidden="true">•</span> : null}

          {post.data.draft ? <span>{t("draft")}</span> : null}
        </div>

        <hr className="my-8" />
        <div className="flex justify-between">
          {previousPost ? (
            <NavLink
              className="max-w-[45%] truncate rounded-md px-2 py-1 text-primary hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              href={previousPost.url as Route}
              transitionTypes={["slide-back"]}
            >
              ← {previousPost.data.title}
            </NavLink>
          ) : (
            <div />
          )}

          {nextPost ? (
            <NavLink
              className="max-w-[45%] truncate rounded-md px-2 py-1 text-primary hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              href={nextPost.url as Route}
              transitionTypes={["slide-forward"]}
            >
              {nextPost.data.title} →
            </NavLink>
          ) : null}
        </div>
      </section>
    </section>
  );
}
