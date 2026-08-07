import { CARE_EVENT_TYPES, type CareEvent } from "@/lib/reminders/types";
import type { SymptomEntry } from "@/lib/symptoms/types";

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) {
    return `${trimTrailingZero((bytes / 1024).toFixed(1))} KB`;
  }
  return `${trimTrailingZero((bytes / (1024 * 1024)).toFixed(1))} MB`;
}

function trimTrailingZero(n: string): string {
  return n.endsWith(".0") ? n.slice(0, -2) : n;
}

const DOC_ICON_LABELS: Record<string, string> = {
  "application/pdf": "PDF",
  "image/jpeg": "JPG",
  "image/png": "PNG",
  "image/heic": "HEIC",
  "image/heif": "HEIC",
};

export function docIconLabel(mimeType: string): string {
  return DOC_ICON_LABELS[mimeType] ?? "FILE";
}

// occurred_on is a bare date (y-m-d); parsed as UTC midnight to avoid
// the local-timezone off-by-one day that plain `new Date("y-m-d")`
// parsing can otherwise produce.
function formatShortDate(dateIso: string): string {
  const [y, m, d] = dateIso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function formatCareEventLinkLabel(event: CareEvent): string {
  const typeLabel = CARE_EVENT_TYPES.find((t) => t.value === event.type)?.label ?? event.type;
  return `${typeLabel} – ${event.label} (${formatShortDate(event.occurred_on)})`;
}

export function formatSymptomLinkLabel(entry: SymptomEntry): string {
  return `Symptom – ${entry.description} (${formatShortDate(entry.occurred_at.slice(0, 10))})`;
}
