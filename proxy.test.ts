import { NextResponse } from "next/server";
import { describe, expect, it, vi } from "vitest";
import { shouldExclude } from "./proxy";

vi.mock("next-intl/middleware", () => ({
  default: vi.fn(() => () => NextResponse.next()),
}));

describe("Proxy", () => {
  it("should exclude", () => {
    expect(shouldExclude("/robots.txt")).toEqual(true);
    expect(shouldExclude("/favicon.ico")).toEqual(true);
    expect(shouldExclude("/_next/static")).toEqual(true);
    expect(shouldExclude("/_next/image")).toEqual(true);
    expect(shouldExclude("/.well-known/vercel/flags")).toEqual(true);
  });

  it("should not exclude", () => {
    expect(shouldExclude("/test")).toEqual(false);
    expect(shouldExclude("/test.md")).toEqual(false);
  });
});
