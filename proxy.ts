import { type NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";

import { routing } from "./shared/i18n/routing";

const exclusions = ["/_next/", "/.well-known/", "/."];
const allowedExts = [".md"];
const extPattern = /\.[^/]+$/;

export const shouldExclude = (path: string) =>
  exclusions.some((p) => path.startsWith(p)) ||
  (extPattern.test(path) && !allowedExts.some((ext) => path.endsWith(ext)));

export function proxy(request: NextRequest) {
  return shouldExclude(request.nextUrl.pathname)
    ? NextResponse.next()
    : createMiddleware(routing)(request);
}

export const config = {
  matcher: "/:path*",
};
