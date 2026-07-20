import { notFound } from "next/navigation";

import { createOgImageResponse } from "@/shared/og-image";
import {
  getOgTitleSize,
  getOgTitleVisualWidth,
} from "@/shared/og-title";
import { siteConfig } from "@/shared/site-config";
import { blog } from "@/shared/source";

const publishedIsoFormatter = new Intl.DateTimeFormat("sv-SE", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "Asia/Seoul",
  year: "numeric",
});

export const revalidate = 86_400;
export const runtime = "nodejs";

export const GET = async (
  _request: Request,
  { params }: { params: Promise<{ locale: string; slug: string[] }> }
) => {
  const { locale, slug } = await params;
  const post = blog.getPage(slug, locale);

  if (!post) {
    notFound();
  }

  const publishedIso = publishedIsoFormatter.format(post.data.published);
  const title = post.data.title ?? siteConfig.title;
  const localizedTitleWidths = ["ko", "en", "ja"].flatMap((localizedLocale) => {
    const localizedPost = blog.getPage(slug, localizedLocale);
    if (!localizedPost) {
      return [];
    }

    const localizedTitle = (
      localizedPost.data.title ?? siteConfig.title
    ).toLocaleUpperCase(localizedLocale);
    return [getOgTitleVisualWidth(localizedTitle)];
  });
  const titleSize = getOgTitleSize(Math.max(...localizedTitleWidths));

  return createOgImageResponse({
    detail: publishedIso,
    locale,
    title,
    titleSize,
  });
};
