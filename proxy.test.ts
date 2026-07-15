import { getRewrittenUrl, isRewrite } from "next/experimental/testing/server";
import { NextRequest, NextResponse } from "next/server";
import { describe, expect, it, vi } from "vitest";

import { proxy, shouldExclude } from "./proxy";

const TEST_TARGET_DOMAIN = "https://minpeter.uk";
const NEXT_INTL_MIDDLEWARE_REWRITE = `${TEST_TARGET_DOMAIN}/HIT/NEXT-INTL`;

vi.mock(import("next-intl/middleware"), () => ({
  default: vi.fn(
    () => () => NextResponse.rewrite(NEXT_INTL_MIDDLEWARE_REWRITE)
  ),
}));

describe("Proxy", () => {
  it("should exclude", () => {
    expect(shouldExclude("/robots.txt")).toBeTruthy();
    expect(shouldExclude("/favicon.ico")).toBeTruthy();
    expect(shouldExclude("/_next/static")).toBeTruthy();
    expect(shouldExclude("/_next/image")).toBeTruthy();
    expect(shouldExclude("/assets/images/main-image-1.jpg")).toBeTruthy();
    expect(shouldExclude("/Lickitung.gltf")).toBeTruthy();
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
