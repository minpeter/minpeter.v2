// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import LocaleErrorBoundary from "../error";

describe("app/[locale]/error.tsx", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders recovery UI, shows digest, logs the error, and retries", () => {
    const reset = vi.fn();
    const error = Object.assign(new Error("boom"), { digest: "digest-123" });
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    render(<LocaleErrorBoundary error={error} reset={reset} />);

    expect(
      screen.getByRole("heading", { name: "오류가 발생했습니다" })
    ).toBeDefined();
    expect(screen.getByText("digest-123")).toBeDefined();
    expect(consoleError).toHaveBeenCalledWith(error);

    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));

    expect(reset).toHaveBeenCalledTimes(1);

    const homeLink = screen.getByRole("link", { name: "홈으로 돌아가기" });
    expect(homeLink.getAttribute("href")).toBe("/");
  });

  it("does not render a digest section when no digest is available", () => {
    const reset = vi.fn();
    const error = new Error("boom");
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    render(<LocaleErrorBoundary error={error} reset={reset} />);

    expect(screen.queryByText("오류 ID")).toBeNull();
  });
});
