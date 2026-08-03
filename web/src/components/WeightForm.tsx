"use client";

import { useActionState } from "react";
import type { FormState } from "@/lib/pets/actions";

const initialState: FormState = null;

export default function WeightForm({
  action,
}: {
  action: (prevState: FormState, formData: FormData) => Promise<FormState>;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="add-row">
      {state && "error" in state && (
        <div className="form-error" style={{ width: "100%" }}>
          {state.error}
        </div>
      )}
      <input type="number" step="0.01" min="0" name="value" placeholder="Weight" required />
      <select name="unit" defaultValue="kg">
        <option value="kg">kg</option>
        <option value="lb">lb</option>
      </select>
      <input type="date" name="logged_on" defaultValue={today} required />
      <button className="btn" type="submit" disabled={pending}>
        {pending ? "Logging…" : "Log weight"}
      </button>
    </form>
  );
}
