import { docs, meta } from "fumadocs-mdx:collections/server";
import type { MetaData, PageData } from "fumadocs-core/source";
import { loader } from "fumadocs-core/source";
import type {
  DocCollectionEntry,
  MetaCollectionEntry,
} from "fumadocs-mdx/runtime/server";
import { toFumadocsSource } from "fumadocs-mdx/runtime/server";
import { cacheLife } from "next/cache";

import { decodeSlugs } from "./decode-slugs";
import { getTranslatedLocales, isTranslated } from "./i18n/post-locales";
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

const blogLoader = loader(blogSource, {
  baseUrl: "/blog",
  i18n: {
    defaultLanguage: "ko",
    // Match next-intl `localePrefix: "as-needed"`: Korean URLs stay unprefixed,
    // so links never take a `/ko/...` → `/...` redirect hop.
    hideLocale: "default-locale",
    languages: ["ko", "en", "ja"],
  },
});

// Wrap via prototype so loader getters (e.g. `pageTree`) stay live.
export const blog: typeof blogLoader = Object.assign(
  Object.create(blogLoader) as typeof blogLoader,
  {
    getPage: ((slugs, language) =>
      blogLoader.getPage(
        decodeSlugs(slugs),
        language
      )) satisfies typeof blogLoader.getPage,
  }
);

/** Locales with a real edition of the post at `slugs` (fallbacks excluded). */
export const getPostLocales = (slugs: readonly string[]): AppLocale[] =>
  getTranslatedLocales(
    (locale) => blog.getPage([...slugs], locale),
    routing.locales,
    routing.defaultLocale
  );

/**
 * The post in `locale`, or undefined when only a default-locale fallback
 * exists: `/en/blog/<korean-only>` is a 404, not a duplicate Korean page.
 */
export const getLocalizedPost = (
  slugs: readonly string[] | undefined,
  locale: string
) => {
  const page = blog.getPage(slugs ? [...slugs] : [], locale);
  return page && isTranslated(page, locale, routing.defaultLocale)
    ? page
    : undefined;
};

/** Every page fumadocs lists for `locale`, minus default-locale fallbacks. */
export const getLocalizedPosts = (locale: string) =>
  blog
    .getPages(locale)
    .filter((page) => isTranslated(page, locale, routing.defaultLocale));

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
