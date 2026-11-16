import { describe, expect, it } from "vitest";

import { formatDateLong, formatYear } from "./date";

// 2025-02-02 05:20:25 +0900 — still Feb 1 in UTC.
const EARLY_KST = new Date("2025-02-01T20:20:25.000Z");
// 2025-01-01 00:30 +0900 — still 2024 in UTC.
const NEW_YEAR_KST = new Date("2024-12-31T15:30:00.000Z");

describe("post date formatting pins Asia/Seoul", () => {
  it("formats list and post dates on the KST calendar day", () => {
    expect(formatDateLong(EARLY_KST)).toBe("25. 02. 02.");
  });

  it("groups by the KST year", () => {
    expect(formatYear(NEW_YEAR_KST)).toBe(2025);
  });
});
