import { NextRequest } from "next/server";
import { createI18nMiddleware } from "next-international/middleware";

const languages = ["en", "ko"];
const fallbackLanguage = "ko";
const I18nMiddleware = createI18nMiddleware({
  locales: languages,
  defaultLocale: fallbackLanguage,
  urlMappingStrategy: "rewriteDefault",
  resolveLocaleFromRequest: () => {
    return fallbackLanguage;
  },
});

export function middleware(request: NextRequest) {
  return I18nMiddleware(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next (Next.js internal files)
     * - .well-known (well-known URIs)
     * - *.* - static assets (fonts, images, etc.)
     */
    "/((?!_next/|_next/$|\\.well-known|\\.well-known$|.*\\..*).*)",
  ],
};
