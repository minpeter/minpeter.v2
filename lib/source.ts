import { loader } from "fumadocs-core/source";
import { createMDXSource } from "fumadocs-mdx";

import { docs, meta } from "@/.source";

export const blog = loader({
  i18n: {
    defaultLanguage: "ko",
    languages: ["ko", "en"],
  },
  baseUrl: "/blog",
  source: createMDXSource(docs, meta),
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
    console.error("Post not found");

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
    title: post.data.title,
    draft: post.data.draft,
    date: post.data.date,
    // Safely extract optional fields from dynamic MDX frontmatter
    external_url: (() => {
      const data = post.data as unknown as Record<string, unknown>;
      return typeof data.external_url === "string"
        ? data.external_url
        : undefined;
    })(),
    lang: (() => {
      const data = post.data as unknown as Record<string, unknown>;
      return Array.isArray(data.lang) &&
        data.lang.every((v) => typeof v === "string")
        ? (data.lang as string[])
        : ["ko"];
    })(),
  };
}

export function getPostsMetadata(posts: blogListType): postMetadataType[] {
  return posts
    .sort((a, b) => {
      return b.data.date.getTime() - a.data.date.getTime();
    })
    .map((post) => {
      return getPostMetadata(post);
    });
}
