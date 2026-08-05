import type { ReminderWithPet } from "./types";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function parseDateUtc(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

export function todayIsoUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysToIso(dateIso: string, days: number): string {
  return new Date(parseDateUtc(dateIso) + days * MS_PER_DAY).toISOString().slice(0, 10);
}

// Positive = toIso is after fromIso.
export function daysBetweenUtc(fromIso: string, toIso: string): number {
  return Math.round((parseDateUtc(toIso) - parseDateUtc(fromIso)) / MS_PER_DAY);
}

export type DueTone = "overdue" | "soon" | "ok";

export function formatDueLabel(
  nextDueOn: string,
  todayIso: string = todayIsoUtc(),
): { text: string; tone: DueTone } {
  const diff = daysBetweenUtc(todayIso, nextDueOn);

  if (diff < 0) {
    const days = Math.abs(diff);
    return { text: `${days} day${days === 1 ? "" : "s"} overdue`, tone: "overdue" };
  }
  if (diff === 0) {
    return { text: "Due today", tone: "soon" };
  }
  if (diff <= 7) {
    return { text: `Due in ${diff}d`, tone: "soon" };
  }
  if (diff <= 27) {
    const weeks = Math.round(diff / 7);
    return { text: `In ${weeks} week${weeks === 1 ? "" : "s"}`, tone: "ok" };
  }
  const months = Math.round(diff / 30);
  return { text: `In ${months} month${months === 1 ? "" : "s"}`, tone: "ok" };
}

export function formatRelativeDate(
  dateIso: string,
  todayIso: string = todayIsoUtc(),
): string {
  const diff = daysBetweenUtc(dateIso, todayIso);

  if (diff <= 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff} days ago`;
  if (diff < 30) {
    const weeks = Math.round(diff / 7);
    return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
  }
  if (diff < 365) {
    const months = Math.round(diff / 30);
    return `${months} month${months === 1 ? "" : "s"} ago`;
  }
  const years = Math.round(diff / 365);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}

export type ReminderCounts = { overdueCount: number; upcomingCount: number };

export function groupReminderCountsByPet(
  overdue: ReminderWithPet[],
  upcoming: ReminderWithPet[],
): Map<string, ReminderCounts> {
  const counts = new Map<string, ReminderCounts>();

  for (const r of overdue) {
    const entry = counts.get(r.pet_id) ?? { overdueCount: 0, upcomingCount: 0 };
    entry.overdueCount += 1;
    counts.set(r.pet_id, entry);
  }
  for (const r of upcoming) {
    const entry = counts.get(r.pet_id) ?? { overdueCount: 0, upcomingCount: 0 };
    entry.upcomingCount += 1;
    counts.set(r.pet_id, entry);
  }

  return counts;
}

export function petStatusPill(counts: ReminderCounts | undefined): {
  label: string;
  tone: "overdue" | "ok" | "unknown";
} {
  if (!counts || (counts.overdueCount === 0 && counts.upcomingCount === 0)) {
    return { label: "No reminders yet", tone: "unknown" };
  }
  if (counts.overdueCount > 0) {
    return { label: `${counts.overdueCount} overdue`, tone: "overdue" };
  }
  return { label: "Up to date", tone: "ok" };
}
