import { docs, meta } from "fumadocs-mdx:collections/server";
import type { MetaData, PageData } from "fumadocs-core/source";
import { loader } from "fumadocs-core/source";
import type {
  DocCollectionEntry,
  MetaCollectionEntry,
} from "fumadocs-mdx/runtime/server";
import { toFumadocsSource } from "fumadocs-mdx/runtime/server";
import { cacheLife } from "next/cache";

import { routing } from "./i18n/routing";

export type AppLocale = (typeof routing.locales)[number];

type BlogFrontmatter = PageData & {
  ai_generated_by?: string;
  draft: boolean;
  published: Date;
  drafted?: Date;
  lastModified?: Date;
  external_url?: string;
  lang: string[];
  machine_translated: boolean;
};

type BlogPageData = DocCollectionEntry<"blog", BlogFrontmatter>;
type BlogMetaData = MetaCollectionEntry<MetaData>;

const blogSource = toFumadocsSource<BlogPageData, BlogMetaData>(
  docs as BlogPageData[],
  meta as BlogMetaData[]
);

export const blog = loader(blogSource, {
  baseUrl: "/blog",
  i18n: {
    defaultLanguage: "ko",
    languages: ["ko", "en", "ja"],
  },
});

export type blogListType = ReturnType<typeof blog.getPages>;
export type blogType = ReturnType<typeof blog.getPage>;

export interface postMetadataType {
  draft: boolean;
  drafted?: Date;
  external_url?: string;
  lang: string[];
  published: Date;
  title: string;
  url: string;
}

function getPostMetadata(post: NonNullable<blogType>): postMetadataType {
  return {
    draft: post.data.draft,
    drafted: post.data.drafted,
    external_url: post.data.external_url,
    lang: post.data.lang.length ? post.data.lang : [routing.defaultLocale],
    published: post.data.published,
    title: post.data.title ?? "",
    url: post.url,
  };
}

export function getPostsMetadata(posts: blogListType): postMetadataType[] {
  return posts
    .toSorted((a, b) => b.data.published.getTime() - a.data.published.getTime())
    .map(getPostMetadata);
}

/**
 * Locale-scoped post index for the blog list and runtime prefetches into it.
 * Build id invalidates on deploy. Do not put full MDX trees in `"use cache"`.
 */
export async function getCachedPostsForLocale(
  locale: AppLocale
): Promise<postMetadataType[]> {
  "use cache";
  cacheLife("days");

  const posts = getPostsMetadata(blog.getPages(locale)).filter((post) =>
    post.lang.includes(locale)
  );
  // `"use cache"` requires async; source tree reads are sync.
  return await Promise.resolve(posts);
}
