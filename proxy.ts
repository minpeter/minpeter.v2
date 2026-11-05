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

const handleDocument = createMiddleware(routing);
// Client-router fetches (RSC navigations, prefetches) must resolve an
// unprefixed path to the default locale, never redirect by cookie or
// Accept-Language: a cross-locale redirect hands the router a tree for a
// different root layout, which it soft-merges into the current page.
const handleRouterFetch = createMiddleware({
  ...routing,
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

export function proxy(request: NextRequest) {
  if (shouldExclude(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  return isRouterFetch(request)
    ? handleRouterFetch(request)
    : handleDocument(request);
}

export const config = {
  matcher: "/:path*",
};
