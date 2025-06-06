import { docs, meta } from "@/.source";
import { createMDXSource } from "fumadocs-mdx";
import { loader } from "fumadocs-core/source";

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
    };
  }

  return {
    url: post.url,
    title: post.data.title,
    draft: post.data.draft,
    date: post.data.date,
    external_url: (post.data as any).external_url,
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
