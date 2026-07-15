import type { Metadata } from "next";

import type { LocaleCode } from "@/shared/constants/locales";
import { routing } from "@/shared/i18n/routing";
import { ogImageSize } from "@/shared/og-image";
import { siteConfig } from "@/shared/site-config";

const openGraphLocales = {
  en: "en_US",
  ja: "ja_JP",
  ko: "ko_KR",
} satisfies Record<LocaleCode, string>;

const isLocale = (value: string): value is LocaleCode =>
  routing.locales.some((locale) => locale === value);

export const resolveLocale = (locale: string | undefined): LocaleCode =>
  locale && isLocale(locale) ? locale : routing.defaultLocale;

const normalizePath = (path: string) => {
  if (path === "/") {
    return "";
  }

  return `/${path.replaceAll(/^\/+|\/+$/gu, "")}`;
};

export const getLocalizedPath = (locale: string, path: string) => {
  const resolvedLocale = resolveLocale(locale);
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

export function createMetadata({
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
  locale?: LocaleCode;
  path?: string;
  title?: string;
}): Metadata {
  const resolvedLocale = resolveLocale(locale);
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
