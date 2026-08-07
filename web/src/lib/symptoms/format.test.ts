import { describe, expect, it } from "vitest";
import { formatSymptomRelativeDate } from "./format";

const TODAY = "2026-08-15";

describe("formatSymptomRelativeDate", () => {
  it("strips the time-of-day before delegating to formatRelativeDate", () => {
    expect(formatSymptomRelativeDate("2026-08-15T14:32:00.000Z", TODAY)).toBe("Today");
  });

  it("reports days ago for a full timestamp earlier this week", () => {
    expect(formatSymptomRelativeDate("2026-08-12T09:00:00.000Z", TODAY)).toBe("3 days ago");
  });
});
