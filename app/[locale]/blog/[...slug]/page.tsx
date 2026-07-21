import { DocsBody } from "fumadocs-ui/page";
import type { Route } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import ExternalRedirect from "@/components/external-redirect";
import Header from "@/components/header";
import { MachineTranslationNotice } from "@/components/machine-translation-notice";
import { siteConfig } from "@/shared/site-config";
import { blog } from "@/shared/source";
import { formatDateLong } from "@/shared/utils/date";
import {
  createMetadata,
  getLocalizedPath,
  resolveLocale,
} from "@/shared/utils/metadata";
import { cn } from "@/shared/utils/tailwind";

import { blogMdxComponents } from "./mdx-components";
import { PostFooter } from "./post-footer";
import { PostToc } from "./post-toc";

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
  const t = await getTranslations({ locale });
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

export default async function Page(
  props: PageProps<"/[locale]/blog/[...slug]">
) {
  const { locale, slug } = await props.params;
  const post = blog.getPage(slug, locale);

  if (!post) {
    notFound();
  }

  if (post.data.external_url) {
    return <ExternalRedirect url={post.data.external_url} />;
  }

  const t = await getTranslations();
  const MDX = post.data.body;

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

      <PostToc toc={post.data.toc} />
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
