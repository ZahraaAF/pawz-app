"use client";

import { useRef } from "react";
import WeightForm from "@/components/WeightForm";
import type { FormState } from "@/lib/pets/actions";

export default function WeightModal({
  action,
}: {
  action: (prevState: FormState, formData: FormData) => Promise<FormState>;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button type="button" className="btn secondary" onClick={() => dialogRef.current?.showModal()}>
        Log weight
      </button>
      <dialog ref={dialogRef} className="modal-dialog">
        <WeightForm
          action={action}
          onSuccess={() => dialogRef.current?.close()}
          onCancel={() => dialogRef.current?.close()}
        />
      </dialog>
    </>
  );
}
