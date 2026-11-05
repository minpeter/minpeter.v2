import { getRewrittenUrl, isRewrite } from "next/experimental/testing/server";
import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { describe, expect, it, vi } from "vitest";

import { isRouterFetch, proxy, shouldExclude } from "./proxy";

const TEST_TARGET_DOMAIN = "https://minpeter.com";
const NEXT_INTL_MIDDLEWARE_REWRITE = `${TEST_TARGET_DOMAIN}/HIT/NEXT-INTL`;

const ROUTER_FETCH_REWRITE = `${TEST_TARGET_DOMAIN}/HIT/NEXT-INTL-NO-DETECTION`;

// Each next-intl instance rewrites to a marker so dispatch is observable.
vi.mock(import("next-intl/middleware"), () => ({
  default: vi.fn(
    (config) => () =>
      NextResponse.rewrite(
        config?.localeDetection === false
          ? ROUTER_FETCH_REWRITE
          : NEXT_INTL_MIDDLEWARE_REWRITE
      )
  ),
}));

// Vitest 5 clears mock calls between tests; snapshot the import-time calls.
const middlewareConfigs = vi
  .mocked(createMiddleware)
  .mock.calls.map(([config]) => config);

describe("Proxy", () => {
  it("should exclude", () => {
    expect(shouldExclude("/robots.txt")).toBeTruthy();
    expect(shouldExclude("/favicon.ico")).toBeTruthy();
    expect(shouldExclude("/_next/static")).toBeTruthy();
    expect(shouldExclude("/_next/image")).toBeTruthy();
    expect(shouldExclude("/assets/images/main-image-1.jpg")).toBeTruthy();
    expect(shouldExclude("/.well-known/vercel/flags")).toBeTruthy();
  });

  it("should exclude metadata image routes", () => {
    expect(shouldExclude("/ko/show/opengraph-image")).toBeTruthy();
    expect(shouldExclude("/en/resume/twitter-image")).toBeTruthy();
    expect(shouldExclude("/ja/blog/opengraph-image")).toBeTruthy();
  });

  it("should proxy metadata image routes without a supported locale", () => {
    expect(shouldExclude("/opengraph-image")).toBeFalsy();
    expect(shouldExclude("/twitter-image")).toBeFalsy();
    expect(shouldExclude("/show/opengraph-image")).toBeFalsy();
    expect(shouldExclude("/xx/show/opengraph-image")).toBeFalsy();
    expect(shouldExclude("/not_a_locale/show/opengraph-image")).toBeFalsy();
  });

  it("should not exclude", () => {
    expect(shouldExclude("/test")).toBeFalsy();
    expect(shouldExclude("/test.md")).toBeFalsy();
    expect(shouldExclude("/subpath/test")).toBeFalsy();
    expect(shouldExclude("/subpath/test.md")).toBeFalsy();
    expect(shouldExclude("/not-a-real-route.json")).toBeFalsy();
    expect(shouldExclude("/subpath/test.gltf")).toBeFalsy();
  });

  it("should proxy", async () => {
    const request = new NextRequest(`${TEST_TARGET_DOMAIN}/test`);
    const response = await proxy(request);

    expect(isRewrite(response)).toBeTruthy();
    expect(getRewrittenUrl(response)).toStrictEqual(
      NEXT_INTL_MIDDLEWARE_REWRITE
    );
  });

  it("should not proxy", async () => {
    const request = new NextRequest(`${TEST_TARGET_DOMAIN}/robots.txt`);
    const response = await proxy(request);

    expect(isRewrite(response)).toBeFalsy();
  });
});

describe("Proxy locale detection", () => {
  const requestWith = (headers: Record<string, string>) =>
    new NextRequest(`${TEST_TARGET_DOMAIN}/blog`, { headers });

  it("recognizes only client-router fetches", () => {
    expect(isRouterFetch(requestWith({ "sec-fetch-dest": "empty" }))).toBe(
      true
    );
    expect(isRouterFetch(requestWith({ rsc: "1" }))).toBe(true);
    for (const dest of ["document", "image", "script", "style", "iframe"]) {
      expect(isRouterFetch(requestWith({ "sec-fetch-dest": dest }))).toBe(
        false
      );
    }
    // Non-browser clients (curl, crawlers) keep full locale detection.
    expect(isRouterFetch(requestWith({}))).toBe(false);
  });

  it("creates one detecting and one non-detecting next-intl instance", () => {
    expect(middlewareConfigs).toHaveLength(2);
    expect(
      middlewareConfigs.map((config) => config?.localeDetection !== false)
    ).toEqual([true, false]);
  });

  it.each([
    [{ "sec-fetch-dest": "empty" }, ROUTER_FETCH_REWRITE],
    [{ rsc: "1", "sec-fetch-dest": "empty" }, ROUTER_FETCH_REWRITE],
    [{ "sec-fetch-dest": "document" }, NEXT_INTL_MIDDLEWARE_REWRITE],
    [{ "sec-fetch-dest": "image" }, NEXT_INTL_MIDDLEWARE_REWRITE],
    [{}, NEXT_INTL_MIDDLEWARE_REWRITE],
  ])("dispatches %o to the matching handler", async (headers, expected) => {
    const response = await proxy(requestWith(headers));

    expect(isRewrite(response)).toBe(true);
    expect(getRewrittenUrl(response)).toBe(expected);
  });
});
