import { NextRequest, NextResponse } from "next/server";
import { createI18nMiddleware } from "next-international/middleware";

export const SUPPORTED_LOCALES = ["en", "ko"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

const fallbackLanguage = "ko";
const I18nMiddleware = createI18nMiddleware({
  locales: SUPPORTED_LOCALES,
  defaultLocale: fallbackLanguage,
  urlMappingStrategy: "rewriteDefault",
  resolveLocaleFromRequest: () => {
    return fallbackLanguage;
  },
});

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Exclusions
  if (pathname.startsWith("/_next/")) return NextResponse.next();
  if (pathname.startsWith("/.well-known/")) return NextResponse.next();
  if (pathname.startsWith("/.")) return NextResponse.next();

  // 2. Exclude paths with a file extension, but allow .md
  const match = pathname.match(/\.[^/]+$/); // last extension
  if (match && match[0] !== ".md") {
    return NextResponse.next();
  }

  return I18nMiddleware(request);
}

export const config = {
  matcher: "/:path*",
};
