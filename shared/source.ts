import { docs, meta } from "fumadocs-mdx:collections/server";
import type { MetaData, PageData } from "fumadocs-core/source";
import { loader } from "fumadocs-core/source";
import {
  type DocCollectionEntry,
  type MetaCollectionEntry,
  toFumadocsSource,
} from "fumadocs-mdx/runtime/server";

type BlogFrontmatter = PageData & {
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

function getPostMetadata(post: blogType): postMetadataType {
  if (!post) {
    return {
      draft: false,
      drafted: undefined,
      external_url: undefined,
      lang: ["ko"],
      published: new Date(),
      title: "",
      url: "",
    };
  }

  return {
    draft: post.data.draft,
    drafted: post.data.drafted,
    external_url: post.data.external_url,
    lang: post.data.lang.length ? post.data.lang : ["ko"],
    published: post.data.published,
    title: post.data.title ?? "",
    url: post.url,
  };
}

export function getPostsMetadata(posts: blogListType): postMetadataType[] {
  return posts
    .sort((a, b) => b.data.published.getTime() - a.data.published.getTime())
    .map((post) => getPostMetadata(post));
}
