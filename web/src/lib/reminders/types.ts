export type CareEventType =
  | "vaccination"
  | "medication"
  | "deworming"
  | "flea_tick"
  | "grooming"
  | "vet_visit"
  | "other";

// Single source of truth for the Zod schema and <select> options.
// The DB check constraint in 0002_reminders.sql duplicates this list -
// keep both in sync if it ever changes.
export const CARE_EVENT_TYPES: { value: CareEventType; label: string }[] = [
  { value: "vaccination", label: "Vaccination" },
  { value: "medication", label: "Medication" },
  { value: "deworming", label: "Deworming" },
  { value: "flea_tick", label: "Flea & tick" },
  { value: "grooming", label: "Grooming" },
  { value: "vet_visit", label: "Vet visit" },
  { value: "other", label: "Other" },
];

export const INTERVAL_PRESETS: {
  value: string;
  label: string;
  days: number | null;
}[] = [
  { value: "weekly", label: "Weekly", days: 7 },
  { value: "biweekly", label: "Every 2 weeks", days: 14 },
  { value: "monthly", label: "Monthly", days: 30 },
  { value: "quarterly", label: "Every 3 months", days: 90 },
  { value: "biannual", label: "Every 6 months", days: 182 },
  { value: "annual", label: "Annually", days: 365 },
  { value: "custom", label: "Custom", days: null },
];

export type ReminderSchedule = {
  id: string;
  pet_id: string;
  type: CareEventType;
  label: string;
  notes: string | null;
  is_recurring: boolean;
  interval_days: number | null;
  next_due_on: string;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type CareEvent = {
  id: string;
  pet_id: string;
  schedule_id: string | null;
  type: CareEventType;
  label: string;
  occurred_on: string;
  notes: string | null;
  created_at: string;
};

export type ReminderWithPet = ReminderSchedule & {
  pets: { id: string; name: string };
};

export type CareEventWithPet = CareEvent & {
  pets: { id: string; name: string };
};
