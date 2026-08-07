export type SymptomSeverity = "mild" | "moderate" | "severe";

// Single source of truth for the Zod schema and <select> options.
// The DB check constraint in 0005_symptoms.sql duplicates this list -
// keep both in sync if it ever changes.
export const SYMPTOM_SEVERITIES: { value: SymptomSeverity; label: string }[] = [
  { value: "mild", label: "Mild" },
  { value: "moderate", label: "Moderate" },
  { value: "severe", label: "Severe" },
];

export type SymptomEntry = {
  id: string;
  pet_id: string;
  description: string;
  occurred_at: string; // ISO timestamptz, not a bare date
  severity: SymptomSeverity;
  photo_path: string | null;
  created_at: string;
};
