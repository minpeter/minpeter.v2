import { describe, expect, it } from "vitest";
import { z } from "zod";

import { parseFrontmatterDate } from "./frontmatter-date";

// Mirrors the published/drafted field transforms in source.config.ts.
const publishedSchema = z.string().or(z.date()).transform(parseFrontmatterDate);

const draftedSchema = z
  .string()
  .or(z.date())
  .optional()
  .transform((value, context) => {
    if (value === undefined) {
      return;
    }
    return parseFrontmatterDate(value, context);
  });

describe("parseFrontmatterDate", () => {
  it("rejects an unparseable date string", () => {
    expect(publishedSchema.safeParse("not-a-date").success).toBe(false);
  });

  it("rejects an impossible calendar date", () => {
    expect(publishedSchema.safeParse("2024-02-30").success).toBe(false);
  });

  it("accepts a valid ISO date string and returns a Date", () => {
    const parsed = publishedSchema.parse("2024-03-05");
    expect(parsed).toBeInstanceOf(Date);
    expect(Number.isNaN(parsed.getTime())).toBe(false);
  });

  it("accepts a Date instance", () => {
    const now = new Date();
    expect(publishedSchema.safeParse(now).success).toBe(true);
  });

  it("allows an omitted optional date", () => {
    expect(draftedSchema.safeParse(undefined).success).toBe(true);
  });

  it("rejects an invalid optional date", () => {
    expect(draftedSchema.safeParse("32/13/2024").success).toBe(false);
  });

  it("reads offset-less timestamps as KST wall time", () => {
    expect(publishedSchema.parse("2022-10-03 20:19:00").toISOString()).toBe(
      "2022-10-03T11:19:00.000Z"
    );
    expect(publishedSchema.parse("2022-10-03T20:19").toISOString()).toBe(
      "2022-10-03T11:19:00.000Z"
    );
  });

  it("keeps explicit offsets and UTC timestamps unchanged", () => {
    expect(
      publishedSchema.parse("2025-02-02 05:20:25 +0900").toISOString()
    ).toBe("2025-02-01T20:20:25.000Z");
    expect(
      publishedSchema.parse("2022-06-15T23:50:15.412Z").toISOString()
    ).toBe("2022-06-15T23:50:15.412Z");
    expect(publishedSchema.parse("2024-03-05").toISOString()).toBe(
      "2024-03-05T00:00:00.000Z"
    );
  });
});
