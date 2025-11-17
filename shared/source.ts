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
  date: Date;
  external_url?: string;
  lang: string[];
};

type BlogPageData = DocCollectionEntry<BlogFrontmatter>;
type BlogMetaData = MetaCollectionEntry<MetaData>;

const blogSource = toFumadocsSource<BlogPageData, BlogMetaData>(
  docs as BlogPageData[],
  meta as BlogMetaData[]
);

export const blog = loader(blogSource, {
  i18n: {
    defaultLanguage: "ko",
    languages: ["ko", "en"],
  },
  baseUrl: "/blog",
});

export type blogListType = ReturnType<typeof blog.getPages>;
export type blogType = ReturnType<typeof blog.getPage>;

export type postMetadataType = {
  url: string;
  title: string;
  draft: boolean;
  date: Date;
  external_url?: string;
  lang: string[];
};

export function getPostMetadata(post: blogType): postMetadataType {
  if (!post) {
    return {
      url: "",
      title: "",
      draft: false,
      date: new Date(),
      external_url: undefined,
      lang: ["ko"],
    };
  }

  return {
    url: post.url,
    title: post.data.title ?? "",
    draft: post.data.draft,
    date: post.data.date,
    external_url: post.data.external_url,
    lang: post.data.lang?.length ? post.data.lang : ["ko"],
  };
}

export function getPostsMetadata(posts: blogListType): postMetadataType[] {
  return posts
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime())
    .map((post) => getPostMetadata(post));
}
