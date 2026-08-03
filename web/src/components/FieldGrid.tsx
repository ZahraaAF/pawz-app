import { fieldValue } from "@/lib/pets/format";
import type { PetWithCurrentWeight } from "@/lib/pets/types";

function Field({
  label,
  value,
}: {
  label: string;
  value: { text: string; unknown: boolean };
}) {
  return (
    <div className="card field">
      <div className="k">{label}</div>
      <div className={`v${value.unknown ? " unknown" : ""}`}>{value.text}</div>
    </div>
  );
}

export default function FieldGrid({ pet }: { pet: PetWithCurrentWeight }) {
  return (
    <div className="field-grid">
      <Field label="Allergies" value={fieldValue(pet.allergies)} />
      <Field label="Notes" value={fieldValue(pet.notes)} />
    </div>
  );
}
