"use client";

import { useActionState, useEffect } from "react";
import { CARE_EVENT_TYPES } from "@/lib/reminders/types";
import type { FormState } from "@/lib/reminders/actions";

const initialState: FormState = null;

export default function LogEventForm({
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
    <form action={formAction} className="card pet-form-card" style={{ marginBottom: 22 }}>
      {state && "error" in state && <div className="form-error">{state.error}</div>}
      {state && "success" in state && (
        <div className="form-success">{state.success}</div>
      )}

      <div className="form-row">
        <div className="field-group">
          <label htmlFor="event-type">Type</label>
          <select id="event-type" name="type" defaultValue={CARE_EVENT_TYPES[0].value}>
            {CARE_EVENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field-group">
          <label htmlFor="event-date">Date</label>
          <input id="event-date" type="date" name="occurred_on" defaultValue={today} max={today} required />
        </div>
      </div>

      <div className="field-group">
        <label htmlFor="event-label">What happened</label>
        <input
          id="event-label"
          name="label"
          placeholder="e.g. Vet check-up, all clear"
          required
        />
      </div>

      <div className="field-group">
        <label htmlFor="event-notes">Notes</label>
        <textarea id="event-notes" name="notes" placeholder="Optional" />
      </div>

      <div className="form-actions">
        <button className="btn" type="submit" disabled={pending}>
          {pending ? "Logging…" : "Log event"}
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
