import type { Metadata } from "next";

import { routing } from "@/shared/i18n/routing";
import { ogImageSize } from "@/shared/og-image";
import { siteConfig } from "@/shared/site-config";

type Locale = (typeof routing.locales)[number];

const openGraphLocales = {
  en: "en_US",
  ja: "ja_JP",
  ko: "ko_KR",
} satisfies Record<Locale, string>;

const isLocale = (value: string): value is Locale =>
  routing.locales.some((locale) => locale === value);

const normalizeLocale = (locale: string | undefined): Locale =>
  locale && isLocale(locale) ? locale : routing.defaultLocale;

const normalizePath = (path: string) => {
  if (path === "/") {
    return "";
  }

  return `/${path.replaceAll(/^\/+|\/+$/gu, "")}`;
};

export const getLocalizedPath = (locale: string, path: string) => {
  const resolvedLocale = normalizeLocale(locale);
  const resolvedPath = normalizePath(path);

  if (resolvedLocale === routing.defaultLocale) {
    return resolvedPath || "/";
  }

  return `/${resolvedLocale}${resolvedPath}`;
};

const getLanguageAlternates = (path: string) => ({
  en: getLocalizedPath("en", path),
  ja: getLocalizedPath("ja", path),
  ko: getLocalizedPath("ko", path),
  "x-default": getLocalizedPath(routing.defaultLocale, path),
});

interface ArticleMetadata {
  authors?: string[];
  modifiedTime?: string;
  publishedTime: string;
  tags?: string[];
}

interface MetadataImage {
  alt: string;
  url: string;
}

export default function NewMetadata({
  article,
  description,
  image,
  locale,
  path,
  title,
}: {
  article?: ArticleMetadata;
  description?: string;
  image?: MetadataImage;
  locale?: string;
  path?: string;
  title?: string;
}): Metadata {
  const resolvedLocale = normalizeLocale(locale);
  const localizedPath = path
    ? getLocalizedPath(resolvedLocale, path)
    : undefined;
  const alternateLocale = Object.entries(openGraphLocales)
    .filter(([candidate]) => candidate !== resolvedLocale)
    .map(([, value]) => value);
  const resolvedImage = image
    ? {
        alt: image.alt,
        height: ogImageSize.height,
        type: "image/png",
        url: image.url,
        width: ogImageSize.width,
      }
    : undefined;
  const sharedOpenGraph = {
    alternateLocale,
    description,
    ...(resolvedImage ? { images: resolvedImage } : {}),
    locale: openGraphLocales[resolvedLocale],
    siteName: siteConfig.title,
    title,
    url: localizedPath,
  };

  return {
    alternates: path
      ? {
          canonical: localizedPath,
          languages: getLanguageAlternates(path),
        }
      : undefined,
    description,
    formatDetection: {
      telephone: false,
    },
    keywords: siteConfig.keywords,
    openGraph: article
      ? {
          ...sharedOpenGraph,
          authors: article.authors,
          modifiedTime: article.modifiedTime,
          publishedTime: article.publishedTime,
          tags: article.tags,
          type: "article",
        }
      : {
          ...sharedOpenGraph,
          type: "website",
        },
    title,
    twitter: {
      card: "summary_large_image",
      creator: "@minpeter",
      description,
      ...(resolvedImage ? { images: resolvedImage } : {}),
      title,
    },
  };
}
