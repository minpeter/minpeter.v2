import type { SortedResult } from "fumadocs-core/search";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/shared/source", () => ({ blog: {} }));

import { GET, handleSearchRequest } from "./route";

function searchResults(count: number): SortedResult[] {
  return Array.from({ length: count }, (_, index) => ({
    content: `Result ${index}`,
    id: `result-${index}`,
    type: "page",
    url: `/blog/result-${index}`,
  }));
}

describe("Search API Route", () => {
  it("exports a GET handler", () => {
    expect(GET).toBeTypeOf("function");
  });

  it("canonicalizes an over-limit query and preserves locale", async () => {
    const canonicalQuery = "😀".repeat(200);
    const search = vi.fn(() => Promise.resolve([]));
    const request = new Request(
      `http://localhost:3000/api/search?query=${encodeURIComponent(` ${canonicalQuery}`)}&locale=ja&limit=9999`
    );

    await handleSearchRequest(request, search);

    expect(search).toHaveBeenCalledOnce();
    expect(search).toHaveBeenCalledWith(canonicalQuery, {
      limit: 60,
      locale: "ja",
      mode: "full",
      tag: undefined,
    });
  });

  it("caps caller-requested results at 60", async () => {
    const search = vi.fn(() => Promise.resolve(searchResults(61)));
    const request = new Request(
      "http://localhost:3000/api/search?query=a&limit=9999"
    );

    const response = await handleSearchRequest(request, search);

    const results: unknown = await response.json();
    expect(results).toBeInstanceOf(Array);
    expect(results).toHaveLength(60);
    expect(search).toHaveBeenCalledWith("a", {
      limit: 60,
      locale: null,
      mode: "full",
      tag: undefined,
    });
  });

  it("honors positive caller limits below the ceiling", async () => {
    const search = vi.fn(() => Promise.resolve(searchResults(61)));
    const request = new Request(
      "http://localhost:3000/api/search?query=a&limit=1"
    );

    const response = await handleSearchRequest(request, search);

    const results: unknown = await response.json();
    expect(results).toBeInstanceOf(Array);
    expect(results).toHaveLength(1);
    expect(search).toHaveBeenCalledWith("a", {
      limit: 1,
      locale: null,
      mode: "full",
      tag: undefined,
    });
  });

  it.each([
    ["a missing limit", ""],
    ["zero", "&limit=0"],
    ["a negative number", "&limit=-1"],
    ["a fractional number", "&limit=1.5"],
    ["a non-numeric value", "&limit=garbage"],
  ])("uses the default ceiling for %s", async (_, limitParameter) => {
    const search = vi.fn(() => Promise.resolve(searchResults(61)));
    const request = new Request(
      `http://localhost:3000/api/search?query=a${limitParameter}`
    );

    const response = await handleSearchRequest(request, search);

    const results: unknown = await response.json();
    expect(results).toBeInstanceOf(Array);
    expect(results).toHaveLength(60);
    expect(search).toHaveBeenCalledWith("a", {
      limit: 60,
      locale: null,
      mode: "full",
      tag: undefined,
    });
  });

  it("returns no results without searching for a whitespace-only query", async () => {
    const search = vi.fn(() => Promise.resolve(searchResults(1)));
    const request = new Request(
      `http://localhost:3000/api/search?query=${encodeURIComponent("  \n\t ")}&limit=9999`
    );

    const response = await handleSearchRequest(request, search);

    expect(await response.json()).toStrictEqual([]);
    expect(search).not.toHaveBeenCalled();
  });
});
