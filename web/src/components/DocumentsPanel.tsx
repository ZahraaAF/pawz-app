import { createClient } from "@/lib/supabase/server";
import { getSignedAttachmentDownloadUrl, getSignedAttachmentUrls } from "@/lib/storage/attachments";
import { uploadDocument } from "@/lib/documents/actions";
import DocumentUploadZone from "@/components/DocumentUploadZone";
import DocumentRow from "@/components/DocumentRow";
import type { DocumentWithLink } from "@/lib/documents/types";
import type { CareEvent } from "@/lib/reminders/types";
import type { SymptomEntry } from "@/lib/symptoms/types";

export default async function DocumentsPanel({
  pet,
  documents,
  careEvents,
  symptoms,
}: {
  pet: { id: string; name: string };
  documents: DocumentWithLink[];
  careEvents: CareEvent[];
  symptoms: SymptomEntry[];
}) {
  const boundUploadDocument = uploadDocument.bind(null, pet.id);

  const supabase = await createClient();
  const paths = documents.map((d) => d.file_path);
  const [viewUrls, downloadUrls] = await Promise.all([
    getSignedAttachmentUrls(supabase, paths),
    Promise.all(
      documents.map((d) => getSignedAttachmentDownloadUrl(supabase, d.file_path, d.filename)),
    ),
  ]);
  const downloadUrlByPath = new Map(
    documents.map((d, i) => [d.file_path, downloadUrls[i] ?? undefined]),
  );

  return (
    <div>
      <DocumentUploadZone action={boundUploadDocument} careEvents={careEvents} symptoms={symptoms} />
      {documents.length === 0 ? (
        <div className="empty-state">No documents uploaded for {pet.name} yet.</div>
      ) : (
        <div className="doc-table-wrap">
          <table className="doc-table">
            <thead>
              <tr>
                <th>File</th>
                <th>Linked to</th>
                <th>Added</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <DocumentRow
                  key={doc.id}
                  doc={doc}
                  viewUrl={viewUrls.get(doc.file_path)}
                  downloadUrl={downloadUrlByPath.get(doc.file_path)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
