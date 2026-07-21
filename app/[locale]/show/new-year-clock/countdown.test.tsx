import { NextIntlClientProvider } from "next-intl";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Countdown } from "./countdown";

const MESSAGES = {
  showcase: {
    items: {
      newYear: {
        caption: "{year}년 1월 1일까지 남은 시간입니다.",
        days: "일",
        happy: "새해 복 많이 받으세요!",
        hours: "시간",
        minutes: "분",
        seconds: "초",
        timerLabel: "새해까지 {days}일 {hours}시간 {minutes}분 {seconds}초 남음",
      },
    },
  },
} as const;

function renderSsr() {
  return renderToString(
    <NextIntlClientProvider locale="ko" messages={MESSAGES}>
      <Countdown />
    </NextIntlClientProvider>
  );
}

describe("Countdown SSR initial render", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not render the completed-state message while the target is in the future", () => {
    vi.setSystemTime(new Date("2026-06-01T12:00:00"));

    expect(renderSsr()).not.toContain("새해 복 많이 받으세요!");
  });

  it("renders identical markup at different times (no hydration mismatch source)", () => {
    vi.setSystemTime(new Date("2026-06-01T12:00:00"));
    const first = renderSsr();
    vi.setSystemTime(new Date("2026-06-01T12:00:07"));
    const second = renderSsr();

    expect(first).toBe(second);
  });
});
