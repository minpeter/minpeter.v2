// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";

import BlogPostErrorBoundary from "../error";

const messages = {
  errors: {
    blog: {
      back: "글 목록으로 돌아가기",
      description:
        "요청한 글을 표시하는 중 문제가 발생했습니다. 다시 시도하거나 글 목록으로 돌아가세요.",
      kicker: "블로그 오류",
      retry: "다시 시도",
      title: "글을 불러오지 못했습니다",
    },
  },
} as const;

describe("app/[locale]/blog/[...slug]/error.tsx", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders blog recovery UI, logs the error, and links back to the blog list", () => {
    const reset = vi.fn();
    const error = new Error("failed to load post");
    const consoleError = vi.spyOn(console, "error").mockReturnValue();

    render(
      <NextIntlClientProvider locale="ko" messages={messages}>
        <BlogPostErrorBoundary error={error} reset={reset} />
      </NextIntlClientProvider>
    );

    expect(
      screen.getByRole("heading", { name: "글을 불러오지 못했습니다" })
    ).toBeDefined();
    expect(consoleError).toHaveBeenCalledWith(error);

    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));

    expect(reset).toHaveBeenCalledOnce();

    const blogLink = screen.getByRole("link", { name: "글 목록으로 돌아가기" });
    expect(blogLink.getAttribute("href")).toBe("/ko/blog");
  });
});
