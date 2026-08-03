"use client";

import { useActionState, useState } from "react";
import type { Pet } from "@/lib/pets/types";
import type { FormState } from "@/lib/pets/actions";

const initialState: FormState = null;

type Props = {
  action: (prevState: FormState, formData: FormData) => Promise<FormState>;
  pet?: Pet;
  submitLabel: string;
};

export default function PetForm({ action, pet, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [ageMode, setAgeMode] = useState<"dob" | "estimate">(
    pet?.estimated_age_label ? "estimate" : "dob",
  );

  return (
    <form action={formAction} className="card pet-form-card">
      {state && "error" in state && <div className="form-error">{state.error}</div>}

      <div className="field-group">
        <label htmlFor="name">Name</label>
        <input id="name" name="name" defaultValue={pet?.name} required />
      </div>

      <div className="field-group">
        <label htmlFor="species">Species</label>
        <select id="species" name="species" defaultValue={pet?.species ?? "dog"}>
          <option value="dog">Dog</option>
          <option value="cat">Cat</option>
        </select>
      </div>

      <div className="field-group">
        <label htmlFor="breed">Breed</label>
        <input
          id="breed"
          name="breed"
          defaultValue={pet?.breed ?? ""}
          placeholder="Unknown"
        />
      </div>

      <div className="field-group">
        <label>Age</label>
        <div className="radio-row">
          <label>
            <input
              type="radio"
              checked={ageMode === "dob"}
              onChange={() => setAgeMode("dob")}
            />
            Known birthdate
          </label>
          <label>
            <input
              type="radio"
              checked={ageMode === "estimate"}
              onChange={() => setAgeMode("estimate")}
            />
            Estimated age
          </label>
        </div>
        {ageMode === "dob" ? (
          <input type="date" name="dob" defaultValue={pet?.dob ?? ""} />
        ) : (
          <input
            type="text"
            name="estimated_age_label"
            defaultValue={pet?.estimated_age_label ?? ""}
            placeholder="e.g. 2 years"
          />
        )}
        <div className="hint">Use whichever you actually know — not both.</div>
      </div>

      <div className="form-row">
        <div className="field-group">
          <label htmlFor="sex">Sex</label>
          <select id="sex" name="sex" defaultValue={pet?.sex ?? ""}>
            <option value="">Unknown</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
        <div className="field-group">
          <label htmlFor="neutered">Neutered / spayed</label>
          <select
            id="neutered"
            name="neutered"
            defaultValue={pet?.neutered == null ? "" : String(pet.neutered)}
          >
            <option value="">Unknown</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>
      </div>

      <div className="field-group">
        <label htmlFor="allergies">Allergies</label>
        <textarea
          id="allergies"
          name="allergies"
          defaultValue={pet?.allergies ?? ""}
          placeholder="Unknown"
        />
      </div>

      <div className="field-group">
        <label htmlFor="notes">Notes</label>
        <textarea
          id="notes"
          name="notes"
          defaultValue={pet?.notes ?? ""}
          placeholder="Anything worth remembering"
        />
      </div>

      <div className="form-actions">
        <button className="btn" type="submit" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
