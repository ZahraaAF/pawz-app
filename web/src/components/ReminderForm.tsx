"use client";

import { useActionState, useEffect, useState } from "react";
import { CARE_EVENT_TYPES, INTERVAL_PRESETS } from "@/lib/reminders/types";
import type { FormState } from "@/lib/reminders/actions";

const initialState: FormState = null;

export default function ReminderForm({
  action,
  onSuccess,
  onCancel,
}: {
  action: (prevState: FormState, formData: FormData) => Promise<FormState>;
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [isRecurring, setIsRecurring] = useState(false);
  const [intervalPreset, setIntervalPreset] = useState(INTERVAL_PRESETS[0].value);
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
      {state && "success" in state && (
        <div className="form-success">{state.success}</div>
      )}

      <div className="form-row">
        <div className="field-group">
          <label htmlFor="reminder-type">Type</label>
          <select id="reminder-type" name="type" defaultValue={CARE_EVENT_TYPES[0].value}>
            {CARE_EVENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field-group">
          <label htmlFor="reminder-due">Due date</label>
          <input id="reminder-due" type="date" name="next_due_on" defaultValue={today} required />
        </div>
      </div>

      <div className="field-group">
        <label htmlFor="reminder-label">Label</label>
        <input
          id="reminder-label"
          name="label"
          placeholder="e.g. NexGard chewable"
          required
        />
      </div>

      <div className="field-group">
        <label htmlFor="reminder-recurring">Repeats?</label>
        <select
          id="reminder-recurring"
          name="is_recurring"
          value={isRecurring ? "true" : "false"}
          onChange={(e) => setIsRecurring(e.target.value === "true")}
        >
          <option value="false">No — one-off</option>
          <option value="true">Yes — recurring</option>
        </select>
      </div>

      {isRecurring && (
        <div className="form-row">
          <div className="field-group">
            <label htmlFor="reminder-interval">Every</label>
            <select
              id="reminder-interval"
              name="interval_preset"
              value={intervalPreset}
              onChange={(e) => setIntervalPreset(e.target.value)}
            >
              {INTERVAL_PRESETS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          {intervalPreset === "custom" && (
            <div className="field-group">
              <label htmlFor="reminder-interval-custom">Days</label>
              <input
                id="reminder-interval-custom"
                type="number"
                min="1"
                name="interval_days_custom"
                placeholder="e.g. 45"
              />
            </div>
          )}
        </div>
      )}

      <div className="field-group">
        <label htmlFor="reminder-notes">Notes</label>
        <textarea id="reminder-notes" name="notes" placeholder="Optional" />
      </div>

      <div className="form-actions">
        <button className="btn" type="submit" disabled={pending}>
          {pending ? "Adding…" : "Add reminder"}
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
