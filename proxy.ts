import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { routing } from "./shared/i18n/routing";

const exclusions = ["/_next/", "/.well-known/", "/.", "/api/"];
const publicAssetPrefixes = ["/assets/", "/fonts/"];
const metadataImageSuffixes = ["/opengraph-image", "/twitter-image"];
const publicAssetPaths = new Set([
  "/Lickitung.gltf",
  "/favicon.ico",
  "/naver2d846b9f797451003a82b4505217b4c0.html",
  "/og-image.png",
  "/robots.txt",
  "/sitemap.xml",
  "/studio_small_03_1k.hdr",
]);

export const shouldExclude = (path: string) =>
  exclusions.some((p) => path.startsWith(p)) ||
  publicAssetPrefixes.some((p) => path.startsWith(p)) ||
  metadataImageSuffixes.some((suffix) => path.endsWith(suffix)) ||
  publicAssetPaths.has(path);

export function proxy(request: NextRequest) {
  if (shouldExclude(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  return createMiddleware(routing)(request);
}

export const config = {
  matcher: "/:path*",
};
