// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useTypingStats } from "./use-typing-stats";

vi.mock(import("next-intl"), () => ({
  useLocale: () => "en",
}));

describe(useTypingStats, () => {
  it("shows current zero accuracy instead of stale completed sentence accuracy", () => {
    const { rerender, result } = renderHook(
      ({ target, userInput }) => useTypingStats(userInput, "", target, 0, 6000),
      {
        initialProps: {
          target: "hello",
          userInput: "hello",
        },
      }
    );

    act(() => {
      result.current.resetStats();
    });

    rerender({
      target: "abc",
      userInput: "x",
    });

    expect(result.current.accuracy).toBe(0);
    expect(result.current.displayAccuracy).toBe(0);
  });

  it("clears preserved stats for an explicit retry reset", () => {
    const { rerender, result } = renderHook(
      ({ target, userInput }) => useTypingStats(userInput, "", target, 0, 6000),
      {
        initialProps: {
          target: "hello",
          userInput: "hello",
        },
      }
    );

    act(() => {
      result.current.resetStats();
    });

    rerender({
      target: "hello",
      userInput: "",
    });

    expect(result.current.shouldShowStats).toBeTruthy();
    expect(result.current.displayAccuracy).toBe(100);

    act(() => {
      result.current.clearStats();
    });

    expect(result.current.shouldShowStats).toBeFalsy();
    expect(result.current.displayValue).toBe(0);
    expect(result.current.displayAccuracy).toBe(0);
  });
});
