import { type NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";

import { routing } from "./shared/i18n/routing";

const extensionPattern = /\.[^/]+$/;

const expectedPaths = ["/_next/", "/.well-known/", "/."];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Exclusions
  if (expectedPaths.map((path) => pathname.startsWith(path)).includes(true)) {
    // skip middleware by expectedPaths
    return;
  }

  // 2. Exclude paths with a file extension, but allow .md
  const match = pathname.match(extensionPattern); // last extension
  if (match && match[0] !== ".md") {
    return NextResponse.next();
  }

  return createMiddleware(routing)(request);
}

export const config = {
  matcher: "/:path*",
};
