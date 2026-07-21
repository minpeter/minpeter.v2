import { ImageZoom } from "fumadocs-ui/components/image-zoom";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import defaultMdxComponents from "fumadocs-ui/mdx";
import type { Route } from "next";
import Link from "next/link";
import type { ComponentProps } from "react";

import { BlogCallout, BlogRelatedLink } from "@/components/blog-callout";
import { MediaGrid } from "@/components/media-grid";

export function createBlogMdxComponents() {
  let firstImageEager = true;

  return {
    ...defaultMdxComponents,
    Callout: BlogCallout,
    MediaGrid,
    RelatedLink: BlogRelatedLink,
    Tab,
    Tabs,
    a: (anchorProps: ComponentProps<"a">) => {
      const { href, children, ...rest } = anchorProps;
      const isInternalLink = href?.startsWith("/") && !href.startsWith("//");
      if (isInternalLink) {
        return (
          <Link
            className="rounded-md px-2 py-1 text-primary hover:bg-secondary"
            href={href as Route}
            {...(rest as Record<string, unknown>)}
          >
            {children}
          </Link>
        );
      }
      return (
        <a
          className="rounded-md px-2 py-1 text-primary hover:bg-secondary"
          href={href}
          rel="noopener noreferrer"
          target="_blank"
          {...rest}
        >
          {children}
        </a>
      );
    },
    img: (imageProps: ComponentProps<"img">) => {
      const eager = firstImageEager;
      firstImageEager = false;
      return (
        <ImageZoom
          {...(imageProps as ComponentProps<typeof ImageZoom>)}
          fetchPriority={eager ? "high" : "auto"}
          loading={eager ? "eager" : "lazy"}
        />
      );
    },
  };
}
