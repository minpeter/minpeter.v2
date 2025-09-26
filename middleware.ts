import { NextRequest } from "next/server";
import { createI18nMiddleware } from "next-international/middleware";

const I18nMiddleware = createI18nMiddleware({
  locales: ["en", "ko"],
  defaultLocale: "ko",
  urlMappingStrategy: "rewriteDefault",
  resolveLocaleFromRequest: (request) => {
    // FIXME: Temporarily patches a bug inside the next-international library.
    if (request.nextUrl.pathname.startsWith("/en")) {
      return "en";
    }
    return "ko";
  },
});

export function middleware(request: NextRequest) {
  return I18nMiddleware(request);
}

export const config = {
  runtime: "nodejs",
  // Matcher ignoring `/_next/`, `/api/`, and files with extensions
  // ".*\\..*" 는 확장자가 있는 경우 (public의 에셋인 경우) 예외처리
  matcher: [
    "/((?!api|.well-known|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
