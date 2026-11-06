import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";

import { routing } from "./shared/i18n/routing";

const exclusions = ["/_next/", "/.", "/api/"];
const publicAssetPrefixes = ["/assets/", "/fonts/"];
const metadataImageSuffixes = ["/opengraph-image", "/twitter-image"];
const publicAssetPaths = new Set([
  "/favicon.ico",
  "/naver2d846b9f797451003a82b4505217b4c0.html",
  "/og-image.png",
  "/robots.txt",
  "/sitemap.xml",
]);

const isMetadataImagePath = (path: string) =>
  metadataImageSuffixes.some(
    (suffix) =>
      path.endsWith(suffix) &&
      routing.locales.some((locale) => path.startsWith(`/${locale}/`))
  );

export const shouldExclude = (path: string) =>
  exclusions.some((p) => path.startsWith(p)) ||
  publicAssetPrefixes.some((p) => path.startsWith(p)) ||
  isMetadataImagePath(path) ||
  publicAssetPaths.has(path);

// Locale detection (cookie, then Accept-Language) runs only for a real page
// load of the site root `/`. Every other URL renders in the locale it names
// (unprefixed = Korean), so:
// - client-router fetches never get a cross-locale redirect, which would hand
//   the router a different root layout to soft-merge into the current page;
// - Back after a language switch returns to the Korean page instead of being
//   bounced to the saved locale again;
// - a shared Korean link always opens in Korean.
const handleDetecting = createMiddleware(routing);
// Only page loads of `/` and of locale-prefixed URLs (the language selector's
// targets) update the saved preference; every other visit leaves it untouched.
const handleUrlLocale = createMiddleware({
  ...routing,
  localeCookie: false,
  localeDetection: false,
});

/**
 * App Router navigations and prefetches are `fetch()` calls (`Sec-Fetch-Dest:
 * empty`) carrying the `RSC` header. Next strips router headers before Proxy
 * runs on some paths, so the fetch destination is the reliable signal;
 * images, scripts and iframes keep document locale handling.
 */
export const isRouterFetch = (request: NextRequest) =>
  request.headers.get("sec-fetch-dest") === "empty" ||
  request.headers.get("rsc") === "1";

/**
 * Page loads of the bare site root pick a locale from the visitor's
 * preference; page loads of the language-switch targets (`/ko/...`, `/en/...`)
 * record it. Everything else renders the URL's own locale untouched.
 */
export const shouldDetectLocale = (request: NextRequest) =>
  !isRouterFetch(request) &&
  (request.nextUrl.pathname === "/" ||
    routing.locales.some(
      (locale) =>
        request.nextUrl.pathname === `/${locale}` ||
        request.nextUrl.pathname.startsWith(`/${locale}/`)
    ));

/** An uppercase ASCII letter that is not part of a `%XX` escape. */
const UPPERCASE_OUTSIDE_ESCAPES = /(?<percentEscape>%[0-9A-Fa-f]{2})|[A-Z]/gu;

/** Lowercases path letters while preserving percent-escapes such as `%3A`. */
export const foldPathCase = (path: string) =>
  path.replace(
    UPPERCASE_OUTSIDE_ESCAPES,
    (match, percentEscape?: string) => percentEscape ?? match.toLowerCase()
  );

/** Static files keep their on-disk case (e.g. `/fonts/Pretendard-LICENSE.txt`). */
const isCaseSensitivePath = (path: string) =>
  exclusions.some((p) => path.startsWith(p)) ||
  publicAssetPrefixes.some((p) => path.startsWith(p)) ||
  publicAssetPaths.has(path);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Routes are lowercase; fold `/Blog`, `/EN/blog` or `/EN/Show/OpenGraph-Image`
  // onto one canonical URL before any exclusion. Percent-escapes are kept
  // verbatim, so `%3A` slugs and Hangul keep their exact encoding.
  if (!isCaseSensitivePath(pathname)) {
    const folded = foldPathCase(pathname);
    if (folded !== pathname) {
      const url = request.nextUrl.clone();
      url.pathname = folded;
      return NextResponse.redirect(url, 308);
    }
  }

  if (shouldExclude(pathname)) {
    return NextResponse.next();
  }

  return shouldDetectLocale(request)
    ? handleDetecting(request)
    : handleUrlLocale(request);
}

export const config = {
  matcher: "/:path*",
};
