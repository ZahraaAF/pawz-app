import { addDaysToIso, todayIsoUtc } from "@/lib/reminders/format";
import { formatWeight } from "@/lib/pets/format";
import type { WeightEntry } from "@/lib/pets/types";

export type ReportRangePreset = "30d" | "90d" | "180d" | "all";

export const REPORT_RANGE_PRESETS: {
  value: ReportRangePreset;
  label: string;
  days: number | null;
}[] = [
  { value: "30d", label: "Last 30 days", days: 30 },
  { value: "90d", label: "Last 90 days", days: 90 },
  { value: "180d", label: "Last 6 months", days: 180 },
  { value: "all", label: "All time", days: null },
];

// Stand-in for "no lower bound" - well before any real pet record.
const EARLIEST_ISO = "1900-01-01";

export function resolveReportRange(
  preset: ReportRangePreset,
  todayIso: string = todayIsoUtc(),
): { from: string; to: string } {
  const config = REPORT_RANGE_PRESETS.find((p) => p.value === preset) ?? REPORT_RANGE_PRESETS[0];
  const from = config.days == null ? EARLIEST_ISO : addDaysToIso(todayIso, -config.days);
  return { from, to: todayIso };
}

// Deterministic arithmetic only - never call an LLM/summarization service
// from this file (spec req 23: no AI-generated interpretation in the vet
// report).
export function summarizeWeightTrend(history: WeightEntry[]): string {
  if (history.length === 0) return "No weight logged in this period.";

  // history is ordered newest-first (see getWeightHistory).
  const latest = history[0];
  const latestText = formatWeight(latest);
  if (history.length === 1) {
    return `${latestText} (single entry)`;
  }

  const earliest = history[history.length - 1];
  if (earliest.unit !== latest.unit) {
    // Mixed units within the period - too ambiguous to subtract without a
    // conversion table this app doesn't have; report both raw instead of
    // a possibly-wrong delta.
    return `${latestText} (was ${formatWeight(earliest)} at start of period)`;
  }

  const delta = Number((latest.value - earliest.value).toFixed(2));
  if (delta === 0) return `${latestText} (stable)`;
  const direction = delta > 0 ? "+" : "";
  return `${latestText} (${direction}${delta} ${latest.unit} from start of period)`;
}
