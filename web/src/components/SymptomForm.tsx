"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { SYMPTOM_SEVERITIES } from "@/lib/symptoms/types";
import { ALLOWED_PHOTO_MIME_TYPES } from "@/lib/storage/attachments";
import type { FormState } from "@/lib/symptoms/actions";

const initialState: FormState = null;

// <input type="datetime-local"> wants local clock digits, no timezone
// suffix - matches how the value is later parsed in symptoms/actions.ts.
function nowLocalDateTime(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function SymptomForm({
  action,
  onSuccess,
  onCancel,
}: {
  action: (prevState: FormState, formData: FormData) => Promise<FormState>;
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const now = nowLocalDateTime();

  useEffect(() => {
    if (state && "success" in state) {
      onSuccess?.();
    }
    // Only re-run when the action result changes, not on every onSuccess identity change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  useEffect(() => {
    // Revoke the object URL when it's replaced or the form unmounts, so
    // the browser doesn't hold the blob in memory indefinitely.
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  }

  function clearPhoto() {
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  }

  return (
    <form action={formAction} className="card pet-form-card">
      {state && "error" in state && <div className="form-error">{state.error}</div>}
      {state && "success" in state && (
        <div className="form-success">{state.success}</div>
      )}

      <div className="field-group">
        <label htmlFor="symptom-description">What did you notice?</label>
        <textarea
          id="symptom-description"
          name="description"
          placeholder="e.g. Limping on back leg, started this morning"
          required
        />
      </div>

      <div className="form-row">
        <div className="field-group">
          <label htmlFor="symptom-occurred-at">Date & time</label>
          <input
            id="symptom-occurred-at"
            type="datetime-local"
            name="occurred_at"
            defaultValue={now}
            max={now}
            required
          />
        </div>
        <div className="field-group">
          <label htmlFor="symptom-severity">Severity</label>
          <select id="symptom-severity" name="severity" defaultValue={SYMPTOM_SEVERITIES[0].value}>
            {SYMPTOM_SEVERITIES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="field-group">
        <label htmlFor="symptom-photo">Photo (optional)</label>
        <input
          id="symptom-photo"
          ref={fileInputRef}
          type="file"
          name="photo"
          accept={ALLOWED_PHOTO_MIME_TYPES.join(",")}
          onChange={handlePhotoChange}
        />
        {previewUrl && (
          <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 10 }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview, not a remote image */}
            <img
              src={previewUrl}
              alt="Selected photo preview"
              style={{ width: 64, height: 64, objectFit: "cover", borderRadius: "var(--radius-s)" }}
            />
            <button type="button" className="btn secondary" onClick={clearPhoto}>
              Remove photo
            </button>
          </div>
        )}
      </div>

      <div className="form-actions">
        <button className="btn" type="submit" disabled={pending}>
          {pending ? "Logging…" : "Log symptom"}
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
