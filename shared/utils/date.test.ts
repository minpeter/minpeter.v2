import { describe, expect, it } from "vitest";

import { formatDateLong, formatPostDate, formatYear } from "./date";

// 2025-02-02 05:20:25 +0900 — still Feb 1 in UTC.
const EARLY_KST = new Date("2025-02-01T20:20:25.000Z");
// 2025-01-01 00:30 +0900 — still 2024 in UTC.
const NEW_YEAR_KST = new Date("2024-12-31T15:30:00.000Z");

describe("post date formatting pins Asia/Seoul", () => {
  it("formats list dates on the KST calendar day", () => {
    expect(formatPostDate(EARLY_KST, "ko")).toBe("2025년 2월 2일");
    expect(formatPostDate(EARLY_KST, "en")).toBe("Feb 2, 2025");
    expect(formatPostDate(EARLY_KST, "ja")).toBe("2025年2月2日");
  });

  it("formats post header dates on the KST calendar day", () => {
    expect(formatDateLong(EARLY_KST)).toBe("25. 02. 02.");
  });

  it("groups by the KST year", () => {
    expect(formatYear(NEW_YEAR_KST)).toBe(2025);
  });
});
