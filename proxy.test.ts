import { getRewrittenUrl, isRewrite } from "next/experimental/testing/server";
import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { describe, expect, it, vi } from "vitest";

import {
  isRouterFetch,
  proxy,
  shouldDetectLocale,
  shouldExclude,
} from "./proxy";

const TEST_TARGET_DOMAIN = "https://minpeter.com";
const NEXT_INTL_MIDDLEWARE_REWRITE = `${TEST_TARGET_DOMAIN}/HIT/NEXT-INTL`;

const ROUTER_FETCH_REWRITE = `${TEST_TARGET_DOMAIN}/HIT/NEXT-INTL-URL-LOCALE`;

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
    // Deep URLs go through next-intl in URL-locale mode (no detection).
    const request = new NextRequest(`${TEST_TARGET_DOMAIN}/test`);
    const response = await proxy(request);

    expect(isRewrite(response)).toBeTruthy();
    expect(getRewrittenUrl(response)).toStrictEqual(ROUTER_FETCH_REWRITE);
  });

  it("should not proxy", async () => {
    const request = new NextRequest(`${TEST_TARGET_DOMAIN}/robots.txt`);
    const response = await proxy(request);

    expect(isRewrite(response)).toBeFalsy();
  });
});

describe("Proxy locale detection", () => {
  const requestWith = (path: string, headers: Record<string, string> = {}) =>
    new NextRequest(`${TEST_TARGET_DOMAIN}${path}`, { headers });

  it("recognizes only client-router fetches", () => {
    expect(isRouterFetch(requestWith("/", { "sec-fetch-dest": "empty" }))).toBe(
      true
    );
    expect(isRouterFetch(requestWith("/", { rsc: "1" }))).toBe(true);
    for (const dest of ["document", "image", "script", "style", "iframe"]) {
      expect(isRouterFetch(requestWith("/", { "sec-fetch-dest": dest }))).toBe(
        false
      );
    }
    expect(isRouterFetch(requestWith("/"))).toBe(false);
  });

  it("detects/saves the locale only for page loads of / and prefixed URLs", () => {
    for (const path of ["/", "/en", "/ja/blog/x", "/ko/blog/ai-sdk"]) {
      expect(shouldDetectLocale(requestWith(path))).toBe(true);
      expect(
        shouldDetectLocale(requestWith(path, { "sec-fetch-dest": "document" }))
      ).toBe(true);
      // Client-router fetches never detect.
      expect(
        shouldDetectLocale(requestWith(path, { "sec-fetch-dest": "empty" }))
      ).toBe(false);
    }
    // Unprefixed deep URLs render Korean and leave the preference alone.
    for (const path of [
      "/blog",
      "/blog/ai-sdk",
      "/products",
      "/english",
      "/jam",
    ]) {
      expect(shouldDetectLocale(requestWith(path))).toBe(false);
    }
  });

  it("creates one detecting and one URL-locale next-intl instance", () => {
    expect(middlewareConfigs).toHaveLength(2);
    expect(
      middlewareConfigs.map((config) => config?.localeDetection !== false)
    ).toEqual([true, false]);
    // The URL-locale instance never writes the preference cookie.
    expect(middlewareConfigs[1]).toMatchObject({ localeCookie: false });
  });

  it.each([
    ["/", {}, NEXT_INTL_MIDDLEWARE_REWRITE],
    ["/", { "sec-fetch-dest": "document" }, NEXT_INTL_MIDDLEWARE_REWRITE],
    ["/", { rsc: "1", "sec-fetch-dest": "empty" }, ROUTER_FETCH_REWRITE],
    ["/blog", { "sec-fetch-dest": "document" }, ROUTER_FETCH_REWRITE],
    ["/blog/ai-sdk", {}, ROUTER_FETCH_REWRITE],
    ["/blog", { "sec-fetch-dest": "empty" }, ROUTER_FETCH_REWRITE],
  ])(
    "dispatches %s %o to the matching handler",
    async (path, headers, expected) => {
      const response = await proxy(requestWith(path, headers));

      expect(isRewrite(response)).toBe(true);
      expect(getRewrittenUrl(response)).toBe(expected);
    }
  );
});

describe("Proxy case folding", () => {
  it.each([
    ["/Blog", "/blog"],
    ["/EN/blog", "/en/blog"],
    ["/BLOG/ai-sdk?q=Traefik", "/blog/ai-sdk?q=Traefik"],
    ["/blog/tiny-ko%3Awandb/X", "/blog/tiny-ko%3Awandb/x"],
    ["/Blog/%EC%95%84", "/blog/%EC%95%84"],
  ])("308-redirects %s to %s", async (from, to) => {
    const response = await proxy(
      new NextRequest(`${TEST_TARGET_DOMAIN}${from}`)
    );

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe(`${TEST_TARGET_DOMAIN}${to}`);
  });

  it("leaves excluded uppercase assets alone", async () => {
    const response = await proxy(
      new NextRequest(`${TEST_TARGET_DOMAIN}/fonts/Pretendard-LICENSE.txt`)
    );
    expect(response.status).toBe(200);
  });
});
