// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { nextSentencesGenerator } from "../action";
import { useTypingSentences } from "./use-typing-sentences";

vi.mock("../action", () => ({
  nextSentencesGenerator: vi.fn(),
}));

const mockedNextSentencesGenerator = vi.mocked(nextSentencesGenerator);

describe("useTypingSentences", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("clears fetching state when sentence generation rejects with a non-Error value", async () => {
    mockedNextSentencesGenerator.mockRejectedValue("plain failure");

    const { result } = renderHook(() =>
      useTypingSentences("en", () => "Could not fetch sentences")
    );

    await waitFor(() => {
      expect(mockedNextSentencesGenerator).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(result.current.fetchError).toBe("Could not fetch sentences");
    });

    expect(result.current.isFetching).toBe(false);
    expect(result.current.isInitialLoading).toBe(false);
  });

  it("allows retrying sentence fetches after a failed end-of-buffer prefetch", async () => {
    mockedNextSentencesGenerator
      .mockResolvedValueOnce("first sentence")
      .mockResolvedValueOnce("second sentence")
      .mockRejectedValueOnce("prefetch failed")
      .mockResolvedValueOnce("third sentence")
      .mockResolvedValueOnce("fourth sentence");

    const { result } = renderHook(() =>
      useTypingSentences("en", () => "Could not fetch sentences")
    );

    await waitFor(() => {
      expect(result.current.sentences).toEqual([
        "first sentence",
        "second sentence",
      ]);
    });

    act(() => {
      result.current.advanceToNextSentence();
    });

    await waitFor(() => {
      expect(result.current.fetchError).toBe("Could not fetch sentences");
    });

    await act(async () => {
      await result.current.fetchMoreSentences();
    });

    await waitFor(() => {
      expect(result.current.sentences).toEqual([
        "first sentence",
        "second sentence",
        "third sentence",
        "fourth sentence",
      ]);
    });
    expect(result.current.fetchError).toBe(null);
  });
});
