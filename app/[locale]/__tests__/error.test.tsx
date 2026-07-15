// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";

import LocaleErrorBoundary from "../error";

const messages = {
  errors: {
    general: {
      back: "홈으로 돌아가기",
      description:
        "잠시 후 다시 시도하거나 홈으로 이동해 다른 페이지를 확인해 주세요.",
      digestLabel: "오류 ID",
      kicker: "오류 처리",
      retry: "다시 시도",
      title: "오류가 발생했습니다",
    },
  },
} as const;

const renderErrorBoundary = (
  error: Error & { digest?: string },
  reset: () => void
) =>
  render(
    <NextIntlClientProvider locale="ko" messages={messages}>
      <LocaleErrorBoundary error={error} reset={reset} />
    </NextIntlClientProvider>
  );

describe("app/[locale]/error.tsx", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders recovery UI, shows digest, logs the error, and retries", () => {
    const reset = vi.fn();
    const error = Object.assign(new Error("boom"), { digest: "digest-123" });
    const consoleError = vi.spyOn(console, "error").mockReturnValue();

    renderErrorBoundary(error, reset);

    expect(
      screen.getByRole("heading", { name: "오류가 발생했습니다" })
    ).toBeDefined();
    expect(screen.getByText("digest-123")).toBeDefined();
    expect(consoleError).toHaveBeenCalledWith(error);

    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));

    expect(reset).toHaveBeenCalledOnce();

    const homeLink = screen.getByRole("link", { name: "홈으로 돌아가기" });
    expect(homeLink.getAttribute("href")).toBe("/ko");
  });

  it("does not render a digest section when no digest is available", () => {
    const reset = vi.fn();
    const error = new Error("boom");
    vi.spyOn(console, "error").mockReturnValue();

    renderErrorBoundary(error, reset);

    expect(screen.queryByText("오류 ID")).toBeNull();
  });
});
