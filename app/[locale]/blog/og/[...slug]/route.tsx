import { cacheLife } from "next/cache";
import { notFound } from "next/navigation";

import { decodeSlugs } from "@/shared/decode-slugs";
import { createOgImageBytes, ogImageBytesResponse } from "@/shared/og-image";
import { getOgTitleSize, getOgTitleVisualWidth } from "@/shared/og-title";
import { siteConfig } from "@/shared/site-config";
import { getLocalizedPost } from "@/shared/source";

const publishedIsoFormatter = new Intl.DateTimeFormat("sv-SE", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "Asia/Seoul",
  year: "numeric",
});

async function getPostOgImage(locale: string, slug: string[]) {
  "use cache";
  cacheLife("days");

  const post = getLocalizedPost(slug, locale);

  if (!post) {
    notFound();
  }

  const publishedIso = publishedIsoFormatter.format(post.data.published);
  const title = post.data.title ?? siteConfig.title;
  const localizedTitleWidths = ["ko", "en", "ja"].flatMap((localizedLocale) => {
    const localizedPost = getLocalizedPost(slug, localizedLocale);
    if (!localizedPost) {
      return [];
    }

    const localizedTitle = (
      localizedPost.data.title ?? siteConfig.title
    ).toLocaleUpperCase(localizedLocale);
    return [getOgTitleVisualWidth(localizedTitle)];
  });
  const titleSize = getOgTitleSize(Math.max(...localizedTitleWidths));

  return await createOgImageBytes({
    detail: publishedIso,
    locale,
    title,
    titleSize,
  });
}

export const GET = async (
  _request: Request,
  { params }: { params: Promise<{ locale: string; slug: string[] }> }
) => {
  const { locale, slug } = await params;

  return ogImageBytesResponse(await getPostOgImage(locale, decodeSlugs(slug)));
};
