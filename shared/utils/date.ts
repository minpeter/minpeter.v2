export function formatYear(date?: string | number | undefined | Date) {
  const d = new Date(date || new Date());
  return d.getFullYear();
}

// 2022-1-1 -> 22. 01. 01.
export function formatDateLong(date?: string | number | undefined | Date) {
  const d = new Date(date || new Date());

  const year = String(d.getFullYear()).slice(-2);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}. ${month}. ${day}.`;
}

const postDateFormatters = new Map<string, Intl.DateTimeFormat>();

export function formatPostDate(date: Date, locale: string) {
  let formatter = postDateFormatters.get(locale);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    postDateFormatters.set(locale, formatter);
  }
  return formatter.format(date);
}
