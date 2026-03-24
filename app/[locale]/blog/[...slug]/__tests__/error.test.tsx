// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import BlogPostErrorBoundary from "../error";

describe("app/[locale]/blog/[...slug]/error.tsx", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders blog recovery UI, logs the error, and links back to the blog list", () => {
    const reset = vi.fn();
    const error = new Error("failed to load post");
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    render(<BlogPostErrorBoundary error={error} reset={reset} />);

    expect(
      screen.getByRole("heading", { name: "글을 불러오지 못했습니다" })
    ).toBeDefined();
    expect(consoleError).toHaveBeenCalledWith(error);

    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));

    expect(reset).toHaveBeenCalledTimes(1);

    const blogLink = screen.getByRole("link", { name: "글 목록으로 돌아가기" });
    expect(blogLink.getAttribute("href")).toBe("/blog");
  });
});
