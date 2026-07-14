import { afterEach, describe, expect, it, vi } from "vitest";

import { nextSentencesGenerator } from "./action";

describe(nextSentencesGenerator, () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("avoids excluded fallback sentences when no generation token is configured", async () => {
    vi.stubEnv("FRIENDLI_TOKEN", "");

    const firstSentence = await nextSentencesGenerator("en");
    const secondSentence = await nextSentencesGenerator("en", [firstSentence]);

    expect(firstSentence).not.toBe(secondSentence);
  });
});
