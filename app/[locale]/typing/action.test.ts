import { afterEach, describe, expect, it, vi } from "vitest";
import { nextSentencesGenerator } from "./action";

describe("nextSentencesGenerator", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("rotates fallback sentences when no generation token is configured", async () => {
    vi.stubEnv("FRIENDLI_TOKEN", "");
    vi.spyOn(Math, "random").mockReturnValue(0);

    const [firstSentence, secondSentence] = await Promise.all([
      nextSentencesGenerator("en"),
      nextSentencesGenerator("en"),
    ]);

    expect(firstSentence).not.toBe(secondSentence);
  });
});
