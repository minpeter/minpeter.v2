import { getRewrittenUrl, isRewrite } from "next/experimental/testing/server";
import { NextRequest, NextResponse } from "next/server";
import { describe, expect, it, vi } from "vitest";
import { proxy, shouldExclude } from "./proxy";

const TEST_TARGET_DOMAIN = "https://minpeter.uk";
const NEXT_INTL_MIDDLEWARE_REWRITE = `${TEST_TARGET_DOMAIN}/HIT/NEXT-INTL`;

vi.mock("next-intl/middleware", () => ({
  default: vi.fn(
    () => () => NextResponse.rewrite(NEXT_INTL_MIDDLEWARE_REWRITE)
  ),
}));

describe("Proxy", () => {
  it("should exclude", () => {
    expect(shouldExclude("/robots.txt")).toEqual(true);
    expect(shouldExclude("/favicon.ico")).toEqual(true);
    expect(shouldExclude("/_next/static")).toEqual(true);
    expect(shouldExclude("/_next/image")).toEqual(true);
    expect(shouldExclude("/subpath/test.gltf")).toEqual(true);
    expect(shouldExclude("/.well-known/vercel/flags")).toEqual(true);
  });

  it("should not exclude", () => {
    expect(shouldExclude("/test")).toEqual(false);
    expect(shouldExclude("/test.md")).toEqual(false);
    expect(shouldExclude("/subpath/test")).toEqual(false);
    expect(shouldExclude("/subpath/test.md")).toEqual(false);
  });

  it("should proxy", async () => {
    const request = new NextRequest(`${TEST_TARGET_DOMAIN}/test`);
    const response = await proxy(request);

    expect(isRewrite(response)).toEqual(true);
    expect(getRewrittenUrl(response)).toEqual(NEXT_INTL_MIDDLEWARE_REWRITE);
  });

  it("should not proxy", async () => {
    const request = new NextRequest(`${TEST_TARGET_DOMAIN}/robots.txt`);
    const response = await proxy(request);

    expect(isRewrite(response)).toEqual(false);
  });
});
