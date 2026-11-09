import { cacheLife } from "next/cache";
import { notFound } from "next/navigation";

import { createOgImageBytes, ogImageBytesResponse } from "@/shared/og-image";
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

  // Each locale sizes its own title: a shared size is set by the longest
  // (usually English) translation and leaves ko/ja titles undersized.
  return await createOgImageBytes({
    detail: publishedIso,
    locale,
    title,
  });
}

export const GET = async (
  _request: Request,
  { params }: { params: Promise<{ locale: string; slug: string[] }> }
) => {
  const { locale, slug } = await params;

  return ogImageBytesResponse(await getPostOgImage(locale, slug));
};
