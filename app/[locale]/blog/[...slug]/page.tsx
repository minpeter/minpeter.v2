import type { TOCItemType } from "fumadocs-core/toc";
import { Callout } from "fumadocs-ui/components/callout";
import { ImageZoom } from "fumadocs-ui/components/image-zoom";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import defaultMdxComponents from "fumadocs-ui/mdx";
import { DocsBody } from "fumadocs-ui/page";
import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { setStaticParamsLocale } from "next-international/server";

import ExternalRedirect from "@/components/external-redirect";
import Header from "@/components/header";
import { blog } from "@/lib/source";
import styles from "@/lib/styles/stagger-fade-in.module.css";
import { formatDateLong } from "@/lib/utils/date";
import NewMetadata from "@/lib/utils/metadata";
import { cn } from "@/lib/utils/tailwind";
import { getI18n } from "@/locales/server";

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
  const { locale, slug } = await props.params;
  const page = blog.getPage(slug, locale);
  if (!page) {
    notFound();
  }

  return NewMetadata({
    title: page.data.title,
    description: page.data.description,
  });
}

export default async function Page(
  props: PageProps<"/[locale]/blog/[...slug]">
) {
  const { locale, slug } = await props.params;
  setStaticParamsLocale(locale);
  const t = await getI18n();

  const post = blog.getPage(slug, locale);
  const posts = blog.getPages(locale);

  // Redirect to external URL if provided
  if (post?.data.external_url) {
    return <ExternalRedirect url={post.data.external_url} />;
  }
  posts.sort(
    (a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime()
  );

  if (!post) {
    notFound();
  }

  const MDX = post.data.body;

  type PostWithNavigation = (typeof posts)[0] & {
    previous: (typeof posts)[0] | null;
    next: (typeof posts)[0] | null;
  };

  const postsIndex = posts.reduce<Record<string, PostWithNavigation>>(
    (acc, currentPost, index) => {
      acc[currentPost.slugs.join("/")] = {
        ...currentPost,
        previous: posts[index - 1] || null,
        next: posts[index + 1] || null,
      };
      return acc;
    },
    {}
  );

  return (
    <section className={styles.stagger_container}>
      <Header
        description={
          post.data.description === undefined
            ? formatDateLong(post.data.date)
            : post.data.description
        }
        link={{ href: `/${locale}/blog` as Route, text: t("backToBlog") }}
        title={post.data.title}
      />

      <aside className="fixed top-36 left-8 hidden w-72 2xl:block">
        {post.data.toc.length > 0 && (
          <div className="text-sm">
            <nav className={styles.stagger_container}>
              {post.data.toc.map((item: TOCItemType) => (
                <a
                  className={cn(
                    "my-1 block",
                    "animation:enter w-fit rounded-md px-0.5 hover:bg-secondary",
                    "box-decoration-clone px-2 py-1"
                  )}
                  href={item.url}
                  key={item.url}
                  style={{ marginLeft: `${(item.depth - 1) * 1}rem` }}
                >
                  {/* eslint-disable-next-line */}
                  {/* @ts-ignore */}
                  {item.title?.props.children}
                </a>
              ))}
            </nav>
          </div>
        )}
      </aside>
      <DocsBody>
        <div style={{ wordBreak: "break-word", overflowWrap: "break-word" }}>
          <MDX
            className="mdx"
            components={{
              ...defaultMdxComponents,
              img: (imageProps) => <ImageZoom {...imageProps} />,
              Tab,
              Tabs,
              Callout,
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
            }}
          />
        </div>
      </DocsBody>

      <section className="mt-32">
        <div className="mb-8 flex flex-row items-center gap-2 text-muted-foreground text-sm">
          <div className="flex gap-2">
            <span>{t("writeDate")}:</span>
            <time dateTime={new Date(post.data.date).toISOString()}>
              {formatDateLong(post.data.date)}
            </time>
          </div>

          {post.data.lastModified && <>{" • "}</>}

          {post.data.lastModified && (
            <div className="flex gap-2">
              <span>{t("lastModifiedDate")}:</span>
              <time dateTime={new Date(post.data.lastModified).toISOString()}>
                {formatDateLong(post.data.lastModified)}
              </time>
            </div>
          )}

          {post.data.draft && <>{" • "}</>}

          {post.data.draft && <span>draft</span>}
        </div>

        <hr className="my-8" />
        <div className="mb-8 flex flex-col items-center justify-center">
          <h2 className="opacity-60">
            {`${t("prevPost")} / ${t("nextPost")}`}
          </h2>
        </div>
        <div className="flex justify-between">
          {postsIndex[post.slugs.join("/")].previous ? (
            <Link
              className="rounded-md px-2 py-1 text-primary hover:bg-secondary"
              href={
                `${postsIndex[post.slugs.join("/")].previous?.url}` as Route
              }
            >
              ← {postsIndex[post.slugs.join("/")].previous?.data.title}
            </Link>
          ) : (
            <div />
          )}

          {postsIndex[post.slugs.join("/")].next && (
            <Link
              className="rounded-md px-2 py-1 text-primary hover:bg-secondary"
              href={`${postsIndex[post.slugs.join("/")].next?.url}` as Route}
            >
              {postsIndex[post.slugs.join("/")].next?.data.title} →
            </Link>
          )}
        </div>
      </section>
    </section>
  );
}
