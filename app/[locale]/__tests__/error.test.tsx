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
        "한 번 더 불러와 주세요. 계속 문제가 생기면 홈에서 다시 시작할 수 있어요.",
      digestLabel: "오류 ID",
      kicker: "페이지 로딩 오류",
      retry: "다시 시도",
      title: "페이지를 불러오지 못했어요.",
    },
  },
} as const;

const renderErrorBoundary = (
  error: Error & { digest?: string },
  retry: () => void
) =>
  render(
    <NextIntlClientProvider locale="ko" messages={messages}>
      <LocaleErrorBoundary error={error} retry={retry} />
    </NextIntlClientProvider>
  );

describe("app/[locale]/error.tsx", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders recovery UI, shows digest, logs the error, and retries", () => {
    const retry = vi.fn();
    const error = Object.assign(new Error("boom"), { digest: "digest-123" });
    const consoleError = vi.spyOn(console, "error").mockReturnValue();

    renderErrorBoundary(error, retry);

    expect(
      screen.getByRole("heading", { name: "페이지를 불러오지 못했어요." })
    ).toBeDefined();
    expect(screen.getByText("digest-123")).toBeDefined();
    expect(consoleError).toHaveBeenCalledWith(error);

    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));

    expect(retry).toHaveBeenCalledOnce();

    const homeLink = screen.getByRole("link", { name: "홈으로 돌아가기" });
    // `localePrefix: "as-needed"` — the default locale is served unprefixed,
    // so linking to `/ko` would only trigger a redirect to `/`.
    expect(homeLink.getAttribute("href")).toBe("/");
  });

  it("does not render a digest section when no digest is available", () => {
    const retry = vi.fn();
    const error = new Error("boom");
    vi.spyOn(console, "error").mockReturnValue();

    renderErrorBoundary(error, retry);

    expect(screen.queryByText("오류 ID")).toBeNull();
  });

  it("preserves a non-default locale in the document recovery link", () => {
    vi.spyOn(console, "error").mockReturnValue();

    render(
      <NextIntlClientProvider locale="ja" messages={messages}>
        <LocaleErrorBoundary error={new Error("boom")} retry={vi.fn()} />
      </NextIntlClientProvider>
    );

    expect(
      screen.getByRole("link", { name: "홈으로 돌아가기" }).getAttribute("href")
    ).toBe("/ja");
  });
});
