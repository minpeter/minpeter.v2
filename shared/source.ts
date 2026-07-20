import type { MetaData, PageData } from "fumadocs-core/source";
import { loader } from "fumadocs-core/source";
import { toFumadocsSource } from "fumadocs-mdx/runtime/server";
import type {
  DocCollectionEntry,
  MetaCollectionEntry,
} from "fumadocs-mdx/runtime/server";
import { docs, meta } from "fumadocs-mdx:collections/server";

import { routing } from "./i18n/routing";

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
    .map((post) => getPostMetadata(post));
}
