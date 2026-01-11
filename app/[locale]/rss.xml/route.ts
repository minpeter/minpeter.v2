import { getBaseUrl } from "@/shared/env";
import { routing } from "@/shared/i18n/routing";
import { getSiteDescription, siteConfig } from "@/shared/site-config";
import { blog } from "@/shared/source";

type Locale = (typeof routing.locales)[number];

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function generateRssFeed(locale: Locale): string {
  const baseUrl = getBaseUrl();
  const posts = blog.getPages(locale);

  const sortedPosts = posts
    .filter((post) => !post.data.draft)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

  const items = sortedPosts
    .map((post) => {
      const title = escapeXml(post.data.title ?? "Untitled");
      const link = `${baseUrl}${post.url}`;
      const description = escapeXml(post.data.description ?? "");
      const pubDate = post.data.date.toUTCString();
      const guid = link;

      // Generate category tags from post tags (if available in frontmatter)
      const postData = post.data as { tags?: string[] };
      const categories = (postData.tags ?? [])
        .map((tag: string) => `      <category>${escapeXml(tag)}</category>`)
        .join("\n");

      return `    <item>
      <title>${title}</title>
      <link>${link}</link>
      <description>${description}</description>
      <pubDate>${pubDate}</pubDate>
      <guid isPermaLink="true">${guid}</guid>
${categories}
    </item>`;
    })
    .join("\n");

  const langCodeMap: Record<Locale, string> = {
    ko: "ko-KR",
    ja: "ja-JP",
    en: "en-US",
  };
  const langCode = langCodeMap[locale];
  const lastBuildDate = new Date().toUTCString();

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteConfig.title)}</title>
    <link>${baseUrl}</link>
    <description>${escapeXml(getSiteDescription(locale))}</description>
    <language>${langCode}</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${baseUrl}/${locale}/rss.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locale: string }> }
) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as Locale)) {
    return new Response("Not Found", { status: 404 });
  }

  const feed = generateRssFeed(locale as Locale);

  return new Response(feed, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
