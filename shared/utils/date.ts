/**
 * Post dates are authored in KST (`+0900`). Pin formatting to Seoul so the
 * UTC build/runtime on Vercel does not shift early-morning posts a day back.
 */
export const POST_TIME_ZONE = "Asia/Seoul";

const seoulDateParts = new Intl.DateTimeFormat("en-CA", {
  day: "2-digit",
  month: "2-digit",
  timeZone: POST_TIME_ZONE,
  year: "numeric",
});

function getSeoulDateParts(date?: string | number | Date) {
  const parts = seoulDateParts.formatToParts(new Date(date || new Date()));
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return { day: get("day"), month: get("month"), year: get("year") };
}

export function formatYear(date?: string | number | Date) {
  return Number(getSeoulDateParts(date).year);
}

// 2022-1-1 -> 22. 01. 01.
export function formatDateLong(date?: string | number | Date) {
  const { day, month, year } = getSeoulDateParts(date);
  return `${year.slice(-2)}. ${month}. ${day}.`;
}

const postDateFormatters = new Map<string, Intl.DateTimeFormat>();

export function formatPostDate(date: Date, locale: string) {
  let formatter = postDateFormatters.get(locale);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "short",
      timeZone: POST_TIME_ZONE,
      year: "numeric",
    });
    postDateFormatters.set(locale, formatter);
  }
  return formatter.format(date);
}
