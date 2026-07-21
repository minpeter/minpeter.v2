import { z } from "zod";

export function parseFrontmatterDate(
  value: Date | string,
  context: z.RefinementCtx
): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Invalid date",
    });
    return z.NEVER;
  }
  return date;
}
