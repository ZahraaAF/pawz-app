"use client";

import { useRef } from "react";
import LogEventForm from "@/components/LogEventForm";
import type { FormState } from "@/lib/reminders/actions";

export default function LogEventModal({
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
        style={{ marginBottom: 18 }}
        onClick={() => dialogRef.current?.showModal()}
      >
        + Log event
      </button>
      <dialog ref={dialogRef} className="modal-dialog">
        <LogEventForm
          action={action}
          onSuccess={() => dialogRef.current?.close()}
          onCancel={() => dialogRef.current?.close()}
        />
      </dialog>
    </>
  );
}
