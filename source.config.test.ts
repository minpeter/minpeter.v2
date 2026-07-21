import { describe, expect, it } from "vitest";
import { z } from "zod";

import { parseFrontmatterDate } from "./source.config";

const publishedSchema = z
  .string()
  .or(z.date())
  .transform(parseFrontmatterDate);

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

  it("rejects a nonexistent calendar date", () => {
    expect(publishedSchema.safeParse("13월 32일").success).toBe(false);
  });

  it("accepts a valid ISO date string and returns a Date", () => {
    const result = publishedSchema.safeParse("2024-03-05");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBeInstanceOf(Date);
      expect(Number.isNaN(result.data.getTime())).toBe(false);
    }
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
});
