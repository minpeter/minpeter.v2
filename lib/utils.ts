// 2022-1-1 -> 01. 01.
export function formatDate(date?: string | number | undefined | Date) {
  const d = new Date(date ? date : new Date());
  return `${("0" + (d.getMonth() + 1)).slice(-2)}. ${("0" + d.getDate()).slice(
    -2
  )}.`;
}

export function formatYear(date?: string | number | undefined | Date) {
  const d = new Date(date ? date : new Date());
  return d.getFullYear();
}

// 2022-1-1 -> 2022. 01. 01.
export function formatDateLong(date?: string | number | undefined | Date) {
  const d = new Date(date ? date : new Date());

  return `${d.getFullYear()}. ${("0" + (d.getMonth() + 1)).slice(-2)}. ${(
    "0" + d.getDate()
  ).slice(-2)}.`;
}
