"use client";

import { useRef } from "react";
import SymptomForm from "@/components/SymptomForm";
import type { FormState } from "@/lib/symptoms/actions";

export default function SymptomModal({
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
        + Log symptom
      </button>
      <dialog ref={dialogRef} className="modal-dialog">
        <SymptomForm
          action={action}
          onSuccess={() => dialogRef.current?.close()}
          onCancel={() => dialogRef.current?.close()}
        />
      </dialog>
    </>
  );
}
