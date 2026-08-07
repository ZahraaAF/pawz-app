"use client";

import { useActionState, useEffect } from "react";
import type { FormState } from "@/lib/pets/actions";

const initialState: FormState = null;

export default function WeightForm({
  action,
  onSuccess,
  onCancel,
}: {
  action: (prevState: FormState, formData: FormData) => Promise<FormState>;
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (state && "success" in state) {
      onSuccess?.();
    }
    // Only re-run when the action result changes, not on every onSuccess identity change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className="card pet-form-card">
      {state && "error" in state && <div className="form-error">{state.error}</div>}

      <div className="form-row">
        <div className="field-group">
          <label htmlFor="weight-value">Weight</label>
          <input
            id="weight-value"
            type="number"
            step="0.01"
            min="0"
            name="value"
            placeholder="e.g. 4.2"
            required
          />
        </div>
        <div className="field-group">
          <label htmlFor="weight-unit">Unit</label>
          <select id="weight-unit" name="unit" defaultValue="kg">
            <option value="kg">kg</option>
            <option value="lb">lb</option>
          </select>
        </div>
      </div>

      <div className="field-group">
        <label htmlFor="weight-logged-on">Date</label>
        <input id="weight-logged-on" type="date" name="logged_on" defaultValue={today} required />
      </div>

      <div className="form-actions">
        <button className="btn" type="submit" disabled={pending}>
          {pending ? "Logging…" : "Log weight"}
        </button>
        {onCancel && (
          <button className="btn secondary" type="button" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
