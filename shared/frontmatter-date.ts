import { z } from "zod";

const ISO_DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/u;
/** `YYYY-MM-DD HH:MM[:SS]` or `YYYY-MM-DDTHH:MM[:SS]` with no offset or `Z`. */
const LOCAL_DATE_TIME =
  /^(?<date>\d{4}-\d{2}-\d{2})[ T](?<time>\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?)$/u;
/** Posts are authored in KST; offset-less timestamps mean Seoul wall time. */
const AUTHOR_UTC_OFFSET = "+09:00";

/**
 * `new Date("2022-10-03 20:19:00")` uses the build machine's zone (UTC on
 * Vercel), which shifts KST evening posts to the next Seoul day. Pin
 * offset-less timestamps to the author's zone. Date-only values stay UTC
 * midnight, matching their calendar day in every zone we format with.
 */
function toAuthorDate(value: string): Date {
  const groups = LOCAL_DATE_TIME.exec(value.trim())?.groups;
  if (groups) {
    return new Date(`${groups.date}T${groups.time}${AUTHOR_UTC_OFFSET}`);
  }
  return new Date(value);
}

export function parseFrontmatterDate(
  value: Date | string,
  context: z.RefinementCtx
): Date {
  const date = typeof value === "string" ? toAuthorDate(value) : value;
  const invalidCalendarDate =
    typeof value === "string" &&
    ISO_DATE_ONLY.test(value) &&
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) !== value;

  if (Number.isNaN(date.getTime()) || invalidCalendarDate) {
    context.addIssue({
      code: "custom",
      message: "Invalid date",
    });
    return z.NEVER;
  }
  return date;
}
