"use client";

import { useRef } from "react";
import ReminderForm from "@/components/ReminderForm";
import type { FormState } from "@/lib/reminders/actions";

export default function ReminderModal({
  action,
}: {
  action: (prevState: FormState, formData: FormData) => Promise<FormState>;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        className="btn secondary"
        style={{ marginBottom: 14 }}
        onClick={() => dialogRef.current?.showModal()}
      >
        + Add reminder
      </button>
      <dialog ref={dialogRef} className="modal-dialog">
        <ReminderForm
          action={action}
          onSuccess={() => dialogRef.current?.close()}
          onCancel={() => dialogRef.current?.close()}
        />
      </dialog>
    </>
  );
}
