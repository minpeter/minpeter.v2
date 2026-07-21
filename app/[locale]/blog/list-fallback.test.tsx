// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";

import type { postMetadataType } from "@/shared/source";

import { BlogListFallback } from "./list-fallback";

vi.mock(import("@/shared/styles/stagger-fade-in.module.css"), () => ({
  default: new Proxy({}, { get: (_target, key) => String(key) }),
}));

const MESSAGES = {
  draft: "초안",
  noSearchResults: "검색 결과가 없습니다 :/",
} as const;

function makePost(overrides: Partial<postMetadataType>): postMetadataType {
  return {
    draft: false,
    lang: ["en"],
    published: new Date("2024-03-05T00:00:00Z"),
    title: "A Post",
    url: "/blog/a-post",
    ...overrides,
  };
}

const renderFallback = (
  posts: postMetadataType[],
  options: { isLoading?: boolean; lang?: string } = {}
) =>
  render(
    <NextIntlClientProvider locale="en" messages={MESSAGES}>
      <BlogListFallback
        isLoading={options.isLoading}
        lang={options.lang ?? "en"}
        posts={posts}
      />
    </NextIntlClientProvider>
  );

describe(BlogListFallback, () => {
  it("groups posts by year, newest year first", () => {
    renderFallback([
      makePost({ published: new Date("2023-01-10"), title: "Old", url: "/o" }),
      makePost({
        published: new Date("2024-06-15"),
        title: "New",
        url: "/n",
      }),
      makePost({
        published: new Date("2024-02-01"),
        title: "Mid",
        url: "/m",
      }),
    ]);

    const yearHeadings = screen
      .getAllByRole("heading", { level: 2 })
      .map((heading) => heading.textContent);
    expect(yearHeadings).toStrictEqual(["2024", "2023"]);
  });

  it("formats dates with the locale short month pattern", () => {
    renderFallback([makePost({})]);

    const time = screen.getByText("Mar 5, 2024");
    expect(time.tagName).toBe("TIME");
    expect(time.getAttribute("datetime")).toBe(
      new Date("2024-03-05T00:00:00Z").toISOString()
    );
  });

  it("renders a draft badge instead of the date for draft posts", () => {
    renderFallback([makePost({ draft: true })]);

    expect(screen.getByText("초안")).toBeTruthy();
    expect(screen.queryByText("Mar 5, 2024")).toBeNull();
  });

  it("renders external posts as new-tab anchors", () => {
    renderFallback([
      makePost({ external_url: "https://example.com/post", title: "Ext" }),
    ]);

    const anchor = screen.getByRole("link", { name: /Ext/ });
    expect(anchor.getAttribute("href")).toBe("https://example.com/post");
    expect(anchor.getAttribute("target")).toBe("_blank");
    expect(anchor.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("shows the empty state when no posts match", () => {
    renderFallback([]);

    expect(screen.getByText("검색 결과가 없습니다 :/")).toBeTruthy();
  });

  it("marks the list busy while loading", () => {
    const { container } = renderFallback([makePost({})], { isLoading: true });

    expect(container.firstElementChild?.getAttribute("aria-busy")).toBe("true");
  });
});
