"use client";

import { useActionState, useEffect, useRef, useState, type DragEvent } from "react";
import { formatBytes, formatCareEventLinkLabel, formatSymptomLinkLabel } from "@/lib/documents/format";
import { ALLOWED_DOCUMENT_MIME_TYPES } from "@/lib/storage/attachments";
import type { FormState } from "@/lib/documents/actions";
import type { CareEvent } from "@/lib/reminders/types";
import type { SymptomEntry } from "@/lib/symptoms/types";

const initialState: FormState = null;

export default function DocumentUploadZone({
  action,
  careEvents,
  symptoms,
}: {
  action: (prevState: FormState, formData: FormData) => Promise<FormState>;
  careEvents: CareEvent[];
  symptoms: SymptomEntry[];
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset the selected file when the action result changes to success -
  // computed during render (React's documented pattern for adjusting
  // state from a changed value, https://react.dev/reference/react/useState#storing-information-from-previous-renders)
  // rather than in a useEffect, which would call setState after commit
  // and cause an extra cascading render.
  const [prevState, setPrevState] = useState(state);
  if (state !== prevState) {
    setPrevState(state);
    if (state && "success" in state) {
      setSelectedFile(null);
    }
  }

  // Clearing the uncontrolled <input>'s value is a real DOM side effect
  // (syncing React state to an external system), so it belongs in an
  // effect - unlike the setState above, this doesn't trigger
  // react-hooks/set-state-in-effect.
  useEffect(() => {
    if (selectedFile === null && inputRef.current) {
      inputRef.current.value = "";
    }
  }, [selectedFile]);

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
    // Wire the dropped file(s) into the same <input> the form submits,
    // so a single element serves both the click-to-pick and
    // drag-and-drop paths without needing to re-render a fresh input.
    if (inputRef.current) inputRef.current.files = e.dataTransfer.files;
    setSelectedFile(e.dataTransfer.files[0] ?? null);
  }

  function handleCancel() {
    setSelectedFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <form action={formAction}>
      <input
        ref={inputRef}
        type="file"
        name="file"
        accept={ALLOWED_DOCUMENT_MIME_TYPES.join(",")}
        style={{ display: "none" }}
        onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
      />

      {!selectedFile ? (
        <div
          className={`upload-drop${dragActive ? " drag-active" : ""}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragEnter={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
        >
          <b>Drop a file</b> or click to upload — vaccination certs, bloodwork, receipts
        </div>
      ) : (
        <div className="card pet-form-card document-upload-card">
          {state && "error" in state && <div className="form-error">{state.error}</div>}

          <div className="field-group">
            <div style={{ fontSize: 13, fontWeight: 600 }}>{selectedFile.name}</div>
            <div style={{ fontSize: 12, color: "var(--ink-faint)" }}>
              {formatBytes(selectedFile.size)}
            </div>
          </div>

          {(careEvents.length > 0 || symptoms.length > 0) && (
            <div className="field-group">
              <label htmlFor="document-link">Link to (optional)</label>
              <select id="document-link" name="link" defaultValue="none">
                <option value="none">No link</option>
                {careEvents.length > 0 && (
                  <optgroup label="Care events">
                    {careEvents.map((e) => (
                      <option key={e.id} value={`care_event:${e.id}`}>
                        {formatCareEventLinkLabel(e)}
                      </option>
                    ))}
                  </optgroup>
                )}
                {symptoms.length > 0 && (
                  <optgroup label="Symptoms">
                    {symptoms.map((s) => (
                      <option key={s.id} value={`symptom_entry:${s.id}`}>
                        {formatSymptomLinkLabel(s)}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>
          )}

          <div className="form-actions">
            <button className="btn" type="submit" disabled={pending}>
              {pending ? "Uploading…" : "Upload"}
            </button>
            <button className="btn secondary" type="button" onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
