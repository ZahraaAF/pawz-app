import { formatRelativeDate } from "@/lib/reminders/format";

// occurred_at is a full timestamptz; formatRelativeDate expects a bare
// y-m-d date, so only the date portion is passed through. Symptom entries
// don't need reminders/format.ts's parseDateUtc workaround themselves -
// that helper exists specifically for date-only strings that JS would
// otherwise misparse as UTC midnight, which doesn't apply here.
export function formatSymptomRelativeDate(occurredAt: string, todayIso?: string): string {
  return todayIso
    ? formatRelativeDate(occurredAt.slice(0, 10), todayIso)
    : formatRelativeDate(occurredAt.slice(0, 10));
}
