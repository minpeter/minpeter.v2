// 2022-1-1 -> 01. 01.
export function formatDate(date?: string | number | undefined | Date) {
  const d = new Date(date ? date : new Date());
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${month}. ${day}.`;
}

export function formatYear(date?: string | number | undefined | Date) {
  const d = new Date(date ? date : new Date());
  return d.getFullYear();
}

// 2022-1-1 -> 22. 01. 01.
export function formatDateLong(date?: string | number | undefined | Date) {
  const d = new Date(date ? date : new Date());

  const year = String(d.getFullYear()).slice(-2);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}. ${month}. ${day}.`;
}
