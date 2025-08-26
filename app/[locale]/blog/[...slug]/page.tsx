import { blog } from "@/lib/source";

import { notFound } from "next/navigation";
import defaultMdxComponents from "fumadocs-ui/mdx";
import { DocsBody } from "fumadocs-ui/page";
import NewMetadata from "@/lib/metadata";
import Header from "@/components/header";
import { cn, formatDateLong } from "@/lib/utils";
import Link from "next/link";
import type { Route } from "next";

import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import { ImageZoom } from "fumadocs-ui/components/image-zoom";
import { Callout } from "fumadocs-ui/components/callout";
import { getI18n } from "@/locales/server";
import { setStaticParamsLocale } from "next-international/server";
import { TOCItemType } from "fumadocs-core/server";
import ExternalRedirect from "@/components/external-redirect";

export async function generateStaticParams() {
  return blog.generateParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string[] }>;
}) {
  const { locale, slug } = await params;
  const page = blog.getPage(slug, locale);
  if (!page) notFound();

  return NewMetadata({
    title: page.data.title,
    description: page.data.description,
  });
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; slug: string[] }>;
}) {
  const { locale, slug } = await params;
  setStaticParamsLocale(locale);
  const t = await getI18n();

  const post = blog.getPage(slug, locale);
  const posts = blog.getPages(locale);

  // Redirect to external URL if provided
  if (post?.data.external_url) {
    return <ExternalRedirect url={post.data.external_url}  />;
  }
  posts.sort(
    (a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime()
  );

  if (!post) notFound();

  const MDX = post.data.body;

  type PostWithNavigation = (typeof posts)[0] & {
    previous: (typeof posts)[0] | null;
    next: (typeof posts)[0] | null;
  };

  const postsIndex = posts.reduce<Record<string, PostWithNavigation>>(
    (acc, post, index) => {
      acc[post.slugs.join("/")] = {
        ...post,
        previous: posts[index - 1] || null,
        next: posts[index + 1] || null,
      };
      return acc;
    },
    {}
  );

  return (
    <section data-animate>
      <Header
        title={post.data.title}
        description={
          post.data.description === undefined
            ? formatDateLong(post.data.date)
            : post.data.description
        }
        link={{ href: `/${locale}/blog` as Route, text: t("backToBlog") }}
      />

      <aside className="fixed top-36 left-8 hidden w-72 2xl:block">
        {post.data.toc.length > 0 && (
          <div className="text-sm">
            <nav data-animate>
              {post.data.toc.map((item: TOCItemType) => (
                <a
                  key={item.url}
                  href={item.url}
                  className={cn(
                    "my-1 block",
                    "hover:bg-secondary/100 animation:enter w-fit rounded-md px-0.5",
                    "box-decoration-clone px-2 py-1"
                  )}
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
              img: (props) => <ImageZoom {...props} />,
              Tab,
              Tabs,
              Callout,
              a: (props) => {
                const { href, children, ...rest } = props;
                const h = href as string | undefined;
                if (h && h.startsWith("/") && !h.startsWith("//")) {
                  return (
                    <Link
                      href={h as Route}
                      className="text-primary hover:bg-secondary/100 rounded-md px-2 py-1"
                      {...(rest as Record<string, unknown>)}
                    >
                      {children}
                    </Link>
                  );
                }
                return (
                  <a
                    href={h}
                    className="text-primary hover:bg-secondary/100 rounded-md px-2 py-1"
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
        <div className="text-muted-foreground mb-8 flex flex-row items-center gap-2 text-sm">
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
              href={`${postsIndex[post.slugs.join("/")].previous?.url}` as Route}
              className="text-primary hover:bg-secondary/100 rounded-md px-2 py-1"
            >
              ← {postsIndex[post.slugs.join("/")].previous?.data.title}
            </Link>
          ) : (
            <div></div>
          )}

          {postsIndex[post.slugs.join("/")].next && (
            <Link
              href={`${postsIndex[post.slugs.join("/")].next?.url}` as Route}
              className="text-primary hover:bg-secondary/100 rounded-md px-2 py-1"
            >
              {postsIndex[post.slugs.join("/")].next?.data.title} →
            </Link>
          )}
        </div>
      </section>
    </section>
  );
}
