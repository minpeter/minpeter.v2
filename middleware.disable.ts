import { NextRequest } from "next/server";
import { createI18nMiddleware } from "next-international/middleware";


const languages = ["en", "ko"]
const fallbackLanguage = "ko"
const I18nMiddleware = createI18nMiddleware({
  locales: languages,
  defaultLocale: fallbackLanguage,
  urlMappingStrategy: "rewrite",
  resolveLocaleFromRequest: (request) => {
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
     * - api (API routes)
     * - _next (Next.js internal files)
     * - favicon.ico (favicon file)
     * - Static assets (fonts, images, etc.)
     * - sitemap.xml, robots.txt, .well-known
     */
    '/((?!_next/$|api/|api$|\\.well-known$|.*\\..*).*)',
  ],
};