import { describe, expect, it } from "vitest";
import {
  addDaysToIso,
  daysBetweenUtc,
  formatDueLabel,
  formatRelativeDate,
  groupReminderCountsByPet,
  petStatusPill,
} from "./format";
import type { ReminderWithPet } from "./types";

const TODAY = "2026-08-15";

describe("daysBetweenUtc", () => {
  it("counts forward across a month boundary", () => {
    expect(daysBetweenUtc("2026-01-28", "2026-02-02")).toBe(5);
  });

  it("counts negative when the second date is earlier", () => {
    expect(daysBetweenUtc("2026-08-15", "2026-08-10")).toBe(-5);
  });
});

describe("addDaysToIso", () => {
  it("rolls over into the next month correctly", () => {
    expect(addDaysToIso("2026-01-30", 3)).toBe("2026-02-02");
  });
});

describe("formatDueLabel", () => {
  it("reports overdue in days", () => {
    expect(formatDueLabel("2026-08-13", TODAY)).toEqual({
      text: "2 days overdue",
      tone: "overdue",
    });
  });

  it("reports due today", () => {
    expect(formatDueLabel(TODAY, TODAY)).toEqual({ text: "Due today", tone: "soon" });
  });

  it("reports due within a week as soon", () => {
    expect(formatDueLabel("2026-08-20", TODAY)).toEqual({
      text: "Due in 5d",
      tone: "soon",
    });
  });

  it("reports a few weeks out as ok, matching the mockup's calm tone for distant reminders", () => {
    expect(formatDueLabel("2026-09-05", TODAY)).toEqual({
      text: "In 3 weeks",
      tone: "ok",
    });
  });

  it("reports far-out reminders in months", () => {
    expect(formatDueLabel("2026-11-15", TODAY)).toEqual({
      text: "In 3 months",
      tone: "ok",
    });
  });
});

describe("formatRelativeDate", () => {
  it("reports today", () => {
    expect(formatRelativeDate(TODAY, TODAY)).toBe("Today");
  });

  it("reports yesterday", () => {
    expect(formatRelativeDate("2026-08-14", TODAY)).toBe("Yesterday");
  });

  it("reports weeks ago", () => {
    expect(formatRelativeDate("2026-08-01", TODAY)).toBe("2 weeks ago");
  });
});

function reminder(overrides: Partial<ReminderWithPet>): ReminderWithPet {
  return {
    id: "r1",
    pet_id: "pet-1",
    type: "medication",
    label: "Test",
    notes: null,
    is_recurring: false,
    interval_days: null,
    next_due_on: TODAY,
    active: true,
    created_at: TODAY,
    updated_at: TODAY,
    pets: { id: "pet-1", name: "Max" },
    ...overrides,
  };
}

describe("groupReminderCountsByPet", () => {
  it("tallies overdue and upcoming separately per pet", () => {
    const overdue = [reminder({ pet_id: "pet-1" })];
    const upcoming = [
      reminder({ pet_id: "pet-1" }),
      reminder({ pet_id: "pet-2" }),
    ];

    const counts = groupReminderCountsByPet(overdue, upcoming);

    expect(counts.get("pet-1")).toEqual({ overdueCount: 1, upcomingCount: 1 });
    expect(counts.get("pet-2")).toEqual({ overdueCount: 0, upcomingCount: 1 });
  });
});

describe("petStatusPill", () => {
  it("shows 'No reminders yet' when there are no active schedules at all", () => {
    expect(petStatusPill(undefined)).toEqual({
      label: "No reminders yet",
      tone: "unknown",
    });
  });

  it("prioritizes overdue over upcoming", () => {
    expect(petStatusPill({ overdueCount: 2, upcomingCount: 3 })).toEqual({
      label: "2 overdue",
      tone: "overdue",
    });
  });

  it("shows 'Up to date' when nothing is overdue but something is upcoming", () => {
    expect(petStatusPill({ overdueCount: 0, upcomingCount: 1 })).toEqual({
      label: "Up to date",
      tone: "ok",
    });
  });
});
