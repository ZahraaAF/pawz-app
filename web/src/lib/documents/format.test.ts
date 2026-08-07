import { describe, expect, it } from "vitest";
import {
  docIconLabel,
  formatBytes,
  formatCareEventLinkLabel,
  formatSymptomLinkLabel,
} from "./format";
import type { CareEvent } from "@/lib/reminders/types";
import type { SymptomEntry } from "@/lib/symptoms/types";

describe("formatBytes", () => {
  it("formats bytes under 1KB as bytes", () => {
    expect(formatBytes(500)).toBe("500 B");
  });

  it("formats an exact KB without a trailing .0", () => {
    expect(formatBytes(2 * 1024)).toBe("2 KB");
  });

  it("formats a fractional KB", () => {
    expect(formatBytes(1536)).toBe("1.5 KB");
  });

  it("formats an exact MB without a trailing .0", () => {
    expect(formatBytes(3 * 1024 * 1024)).toBe("3 MB");
  });

  it("formats a fractional MB", () => {
    expect(formatBytes(2.3 * 1024 * 1024)).toBe("2.3 MB");
  });

  it("formats zero bytes", () => {
    expect(formatBytes(0)).toBe("0 B");
  });
});

describe("docIconLabel", () => {
  it("labels each allowed document MIME type", () => {
    expect(docIconLabel("application/pdf")).toBe("PDF");
    expect(docIconLabel("image/jpeg")).toBe("JPG");
    expect(docIconLabel("image/png")).toBe("PNG");
    expect(docIconLabel("image/heic")).toBe("HEIC");
    expect(docIconLabel("image/heif")).toBe("HEIC");
  });

  it("falls back to a generic label for an unrecognized MIME type", () => {
    expect(docIconLabel("text/plain")).toBe("FILE");
  });
});

function careEvent(overrides: Partial<CareEvent>): CareEvent {
  return {
    id: "e1",
    pet_id: "pet-1",
    schedule_id: null,
    type: "vaccination",
    label: "DHPP booster",
    occurred_on: "2026-01-05",
    notes: null,
    created_at: "2026-01-05",
    ...overrides,
  };
}

function symptomEntry(overrides: Partial<SymptomEntry>): SymptomEntry {
  return {
    id: "s1",
    pet_id: "pet-1",
    description: "Limping on back leg",
    occurred_at: "2026-01-03T09:00:00.000Z",
    severity: "mild",
    photo_path: null,
    created_at: "2026-01-03T09:00:00.000Z",
    ...overrides,
  };
}

describe("formatCareEventLinkLabel", () => {
  it("combines the type label, event label, and short date", () => {
    expect(formatCareEventLinkLabel(careEvent({}))).toBe("Vaccination – DHPP booster (Jan 5)");
  });
});

describe("formatSymptomLinkLabel", () => {
  it("combines the description and short date", () => {
    expect(formatSymptomLinkLabel(symptomEntry({}))).toBe(
      "Symptom – Limping on back leg (Jan 3)",
    );
  });
});
