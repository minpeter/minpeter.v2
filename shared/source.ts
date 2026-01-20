import { docs, meta } from "fumadocs-mdx:collections/server";
import type { MetaData, PageData } from "fumadocs-core/source";
import { loader } from "fumadocs-core/source";
import {
  type DocCollectionEntry,
  type MetaCollectionEntry,
  toFumadocsSource,
} from "fumadocs-mdx/runtime/server";

export type BlogFrontmatter = PageData & {
  draft: boolean;
  published: Date;
  drafted?: Date;
  lastModified?: Date;
  external_url?: string;
  lang: string[];
  machine_translated: boolean;
};

export type BlogPageData = DocCollectionEntry<"blog", BlogFrontmatter>;
type BlogMetaData = MetaCollectionEntry<MetaData>;

const blogSource = toFumadocsSource<BlogPageData, BlogMetaData>(
  docs as BlogPageData[],
  meta as BlogMetaData[]
);

export const blog = loader(blogSource, {
  i18n: {
    defaultLanguage: "ko",
    languages: ["ko", "en", "ja"],
  },
  baseUrl: "/blog",
});

export type blogListType = ReturnType<typeof blog.getPages>;
export type blogType = ReturnType<typeof blog.getPage>;

export interface postMetadataType {
  url: string;
  title: string;
  draft: boolean;
  published: Date;
  drafted?: Date;
  external_url?: string;
  lang: string[];
}

export function getPostMetadata(post: blogType): postMetadataType {
  if (!post) {
    return {
      url: "",
      title: "",
      draft: false,
      published: new Date(),
      drafted: undefined,
      external_url: undefined,
      lang: ["ko"],
    };
  }

  return {
    url: post.url,
    title: post.data.title ?? "",
    draft: post.data.draft,
    published: post.data.published,
    drafted: post.data.drafted,
    external_url: post.data.external_url,
    lang: post.data.lang.length ? post.data.lang : ["ko"],
  };
}

export function getPostsMetadata(posts: blogListType): postMetadataType[] {
  return posts
    .sort((a, b) => b.data.published.getTime() - a.data.published.getTime())
    .map((post) => getPostMetadata(post));
}
