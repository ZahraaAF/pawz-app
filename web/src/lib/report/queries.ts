import { getWeightHistory } from "@/lib/pets/queries";
import { getCareEventsForPet } from "@/lib/reminders/queries";
import { getSymptomsForPetInRange } from "@/lib/symptoms/queries";
import type { WeightEntry } from "@/lib/pets/types";
import type { CareEvent } from "@/lib/reminders/types";
import type { SymptomEntry } from "@/lib/symptoms/types";

export type VetReportData = {
  weights: WeightEntry[];
  careEvents: CareEvent[];
  symptoms: SymptomEntry[];
};

// from/to are date-only (YYYY-MM-DD), inclusive on both ends. Weight and
// care-event dates are already date-only columns, so they're filtered
// in-memory against the existing full-history queries (acceptable at this
// data scale; avoids touching already-shipped query files for a
// range-aware variant). symptom_entries.occurred_at is a full timestamptz,
// so its range query gets explicit day-boundary instants instead.
export async function getVetReportData(
  petId: string,
  from: string,
  to: string,
): Promise<VetReportData> {
  const [weights, careEvents, symptoms] = await Promise.all([
    getWeightHistory(petId),
    getCareEventsForPet(petId),
    getSymptomsForPetInRange(petId, `${from}T00:00:00.000Z`, `${to}T23:59:59.999Z`),
  ]);

  const inRange = (dateOnly: string) => dateOnly >= from && dateOnly <= to;

  return {
    weights: weights.filter((w) => inRange(w.logged_on)),
    careEvents: careEvents.filter((e) => inRange(e.occurred_on)),
    symptoms,
  };
}
