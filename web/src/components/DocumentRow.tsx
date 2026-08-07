import { docIconLabel } from "@/lib/documents/format";
import { formatRelativeDate } from "@/lib/reminders/format";
import DocumentDeleteButton from "@/components/DocumentDeleteButton";
import type { DocumentWithLink } from "@/lib/documents/types";

export default function DocumentRow({
  doc,
  viewUrl,
  downloadUrl,
}: {
  doc: DocumentWithLink;
  viewUrl?: string;
  downloadUrl?: string;
}) {
  const linkedLabel = doc.care_event?.label ?? doc.symptom_entry?.description ?? "—";

  return (
    <tr>
      <td className="doc-name">
        <span className="doc-icon">{docIconLabel(doc.mime_type)}</span>
        {doc.filename}
      </td>
      <td>{linkedLabel}</td>
      <td className="mono">{formatRelativeDate(doc.created_at.slice(0, 10))}</td>
      <td className="doc-actions">
        {viewUrl && (
          <a href={viewUrl} target="_blank" rel="noopener noreferrer">
            View
          </a>
        )}
        {downloadUrl && <a href={downloadUrl}>Download</a>}
        <DocumentDeleteButton documentId={doc.id} />
      </td>
    </tr>
  );
}
