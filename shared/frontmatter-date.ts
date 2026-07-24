import { z } from "zod";

const ISO_DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/u;

export function parseFrontmatterDate(
  value: Date | string,
  context: z.RefinementCtx
): Date {
  const date = new Date(value);
  const invalidCalendarDate =
    typeof value === "string" &&
    ISO_DATE_ONLY.test(value) &&
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) !== value;

  if (Number.isNaN(date.getTime()) || invalidCalendarDate) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Invalid date",
    });
    return z.NEVER;
  }
  return date;
}
