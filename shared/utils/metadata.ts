import type { Metadata } from "next";

import type { LocaleCode } from "@/shared/constants/locales";
import { getBaseUrl } from "@/shared/env";
import { routing } from "@/shared/i18n/routing";
import { ogImageSize } from "@/shared/og-image";
import { siteConfig } from "@/shared/site-config";

const canonicalOrigin = new URL("https://minpeter.com");

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

const getLanguageAlternates = (
  path: string,
  languages: readonly LocaleCode[] = routing.locales
) => ({
  ...Object.fromEntries(
    languages.map((language) => [language, getLocalizedPath(language, path)])
  ),
  ...(languages.includes(routing.defaultLocale)
    ? { "x-default": getLocalizedPath(routing.defaultLocale, path) }
    : {}),
});

interface ArticleMetadata {
  authors?: string[];
  modifiedTime?: string;
  publishedTime: string;
  tags?: string[];
}

interface MetadataImage {
  alt: string;
  twitterUrl?: string;
  url: string;
}

export const createSectionImage = (
  locale: string,
  sectionPath: `/${string}`,
  alt: string
): MetadataImage => {
  const resolvedLocale = resolveLocale(locale);
  const normalized = normalizePath(sectionPath);

  return {
    alt,
    twitterUrl: `/${resolvedLocale}${normalized}/twitter-image`,
    url: `/${resolvedLocale}${normalized}/opengraph-image`,
  };
};

/** A 1200x630 MP4 clip plus its link-preview companions, all paths under `public/`. */
interface MetadataVideo {
  /** Looping GIF of the clip, listed before the still in og:image for unfurlers that animate images. */
  animatedImage: string;
  /** Page with a muted looping `<video>`, iframed by X's player card. */
  player: string;
  url: string;
}

// Next resolves og:image against metadataBase but leaves og:video and twitter:player relative; crawlers need them absolute.
const toAbsoluteUrl = (path: string) => new URL(path, getBaseUrl()).toString();

export function createMetadata({
  article,
  description,
  image,
  languages,
  locale,
  path,
  title,
  video,
}: {
  article?: ArticleMetadata;
  description?: string;
  image?: MetadataImage;
  /** Locales that have this page; defaults to all. Drives hreflang alternates. */
  languages?: readonly LocaleCode[];
  locale?: LocaleCode;
  path?: string;
  title?: string;
  video?: MetadataVideo;
}): Metadata {
  const resolvedLocale = resolveLocale(locale);
  const resolvedDescription =
    description ?? siteConfig.description[resolvedLocale];
  const localizedPath = path
    ? getLocalizedPath(resolvedLocale, path)
    : undefined;
  const canonicalUrl = localizedPath
    ? new URL(localizedPath, canonicalOrigin).toString()
    : undefined;
  const alternateLocale = Object.entries(openGraphLocales).flatMap(
    ([candidate, value]) =>
      candidate === resolvedLocale ||
      (languages && !languages.some((language) => language === candidate))
        ? []
        : [value]
  );
  const resolvedImage = image
    ? {
        alt: image.alt,
        height: ogImageSize.height,
        type: "image/png",
        url: image.url,
        width: ogImageSize.width,
      }
    : undefined;
  const resolvedTwitterImage =
    image && resolvedImage
      ? {
          ...resolvedImage,
          url: image.twitterUrl ?? image.url,
        }
      : undefined;
  const sharedOpenGraph = {
    alternateLocale,
    description: resolvedDescription,
    ...(resolvedImage
      ? {
          images: video
            ? [
                {
                  ...resolvedImage,
                  type: "image/gif",
                  url: video.animatedImage,
                },
                resolvedImage,
              ]
            : resolvedImage,
        }
      : {}),
    ...(video
      ? {
          videos: {
            height: ogImageSize.height,
            type: "video/mp4",
            url: toAbsoluteUrl(video.url),
            width: ogImageSize.width,
          },
        }
      : {}),
    locale: openGraphLocales[resolvedLocale],
    siteName: siteConfig.title,
    title,
    url: localizedPath,
  };

  return {
    alternates: path
      ? {
          canonical: canonicalUrl,
          languages: getLanguageAlternates(path, languages),
        }
      : undefined,
    description: resolvedDescription,
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
      ...(video
        ? {
            card: "player",
            players: {
              height: ogImageSize.height,
              playerUrl: toAbsoluteUrl(video.player),
              streamUrl: toAbsoluteUrl(video.url),
              width: ogImageSize.width,
            },
          }
        : { card: "summary_large_image" }),
      creator: "@minpeter",
      description: resolvedDescription,
      ...(resolvedTwitterImage ? { images: resolvedTwitterImage } : {}),
      title,
    },
  };
}

export const NOT_FOUND_TITLE = "minpeter | 404";

/**
 * Shared 404 metadata. `absoluteImage` is for trees outside `[locale]`
 * (global-not-found) where `metadataBase` is not inherited.
 */
export function createNotFoundMetadata({
  absoluteImage = false,
  description,
  locale,
}: {
  absoluteImage?: boolean;
  description: string;
  locale: string;
}): Metadata {
  const imagePath = getLocalizedPath(locale, "/og/not-found");

  return createMetadata({
    description,
    image: {
      alt: NOT_FOUND_TITLE,
      url: absoluteImage ? toAbsoluteUrl(imagePath) : imagePath,
    },
    locale: resolveLocale(locale),
    title: NOT_FOUND_TITLE,
  });
}
