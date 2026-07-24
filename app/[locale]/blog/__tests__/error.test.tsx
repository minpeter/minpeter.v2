// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";

import BlogListErrorBoundary from "../error";

const messages = {
  errors: {
    blogList: {
      back: "홈으로 돌아가기",
      description:
        "글 목록을 표시하는 중 문제가 발생했습니다. 다시 시도하거나 홈으로 돌아가세요.",
      kicker: "블로그 오류",
      retry: "다시 시도",
      title: "글 목록을 불러오지 못했습니다",
    },
  },
} as const;

describe("app/[locale]/blog/error.tsx", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders blog-list recovery UI, logs the error, and links back home", () => {
    const reset = vi.fn();
    const error = new Error("failed to load posts");
    const consoleError = vi.spyOn(console, "error").mockReturnValue();

    render(
      <NextIntlClientProvider locale="ko" messages={messages}>
        <BlogListErrorBoundary error={error} reset={reset} />
      </NextIntlClientProvider>
    );

    expect(
      screen.getByRole("heading", { name: "글 목록을 불러오지 못했습니다" })
    ).toBeDefined();
    expect(consoleError).toHaveBeenCalledWith(error);

    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));

    expect(reset).toHaveBeenCalledOnce();

    const homeLink = screen.getByRole("link", { name: "홈으로 돌아가기" });
    expect(homeLink.getAttribute("href")).toBe("/ko");
  });
});
