import { describe, expect, it } from "vitest";
import { resolveReportRange, summarizeWeightTrend } from "./format";
import type { WeightEntry } from "@/lib/pets/types";

const TODAY = "2026-08-15";

describe("resolveReportRange", () => {
  it("resolves a 30-day range ending today", () => {
    expect(resolveReportRange("30d", TODAY)).toEqual({ from: "2026-07-16", to: TODAY });
  });

  it("resolves a 90-day range", () => {
    expect(resolveReportRange("90d", TODAY)).toEqual({ from: "2026-05-17", to: TODAY });
  });

  it("resolves 'all time' to a wide-open lower bound", () => {
    expect(resolveReportRange("all", TODAY)).toEqual({ from: "1900-01-01", to: TODAY });
  });

  it("falls back to the 30-day preset for an unrecognized value", () => {
    // @ts-expect-error deliberately passing an invalid preset
    expect(resolveReportRange("bogus", TODAY)).toEqual({ from: "2026-07-16", to: TODAY });
  });
});

function weight(overrides: Partial<WeightEntry>): WeightEntry {
  return {
    id: "w1",
    pet_id: "pet-1",
    value: 10,
    unit: "kg",
    logged_on: TODAY,
    created_at: TODAY,
    ...overrides,
  };
}

describe("summarizeWeightTrend", () => {
  it("reports no data when the period has no entries", () => {
    expect(summarizeWeightTrend([])).toBe("No weight logged in this period.");
  });

  it("reports a single entry without a trend", () => {
    expect(summarizeWeightTrend([weight({ value: 10 })])).toBe("10 kg (single entry)");
  });

  it("reports stable when the weight hasn't changed", () => {
    const history = [weight({ id: "w2", value: 10 }), weight({ id: "w1", value: 10 })];
    expect(summarizeWeightTrend(history)).toBe("10 kg (stable)");
  });

  it("reports a positive delta from the start of the period, newest first", () => {
    const history = [weight({ id: "w2", value: 10.1 }), weight({ id: "w1", value: 10 })];
    expect(summarizeWeightTrend(history)).toBe("10.1 kg (+0.1 kg from start of period)");
  });

  it("reports a negative delta", () => {
    const history = [weight({ id: "w2", value: 9.5 }), weight({ id: "w1", value: 10 })];
    expect(summarizeWeightTrend(history)).toBe("9.5 kg (-0.5 kg from start of period)");
  });

  it("avoids a misleading arithmetic delta across mixed units", () => {
    const history = [
      weight({ id: "w2", value: 10, unit: "kg" }),
      weight({ id: "w1", value: 22, unit: "lb" }),
    ];
    expect(summarizeWeightTrend(history)).toBe("10 kg (was 22 lb at start of period)");
  });
});
