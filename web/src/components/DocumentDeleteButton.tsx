"use client";

import { deleteDocument } from "@/lib/documents/actions";

export default function DocumentDeleteButton({ documentId }: { documentId: string }) {
  const boundDelete = deleteDocument.bind(null, documentId);

  return (
    <form
      action={boundDelete}
      style={{ display: "inline" }}
      onSubmit={(e) => {
        if (!window.confirm("Delete this document? This can't be undone.")) {
          e.preventDefault();
        }
      }}
    >
      <button type="submit" className="r-action-cancel">
        Delete
      </button>
    </form>
  );
}
