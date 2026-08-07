import { createClient } from "@/lib/supabase/server";
import { getSignedAttachmentUrls } from "@/lib/storage/attachments";
import { createSymptomEntry } from "@/lib/symptoms/actions";
import SymptomRow from "@/components/SymptomRow";
import SymptomModal from "@/components/SymptomModal";
import type { SymptomEntry } from "@/lib/symptoms/types";

export default async function SymptomPanel({
  pet,
  symptoms,
}: {
  pet: { id: string; name: string };
  symptoms: SymptomEntry[];
}) {
  const boundCreateSymptomEntry = createSymptomEntry.bind(null, pet.id);

  const photoPaths = symptoms
    .map((s) => s.photo_path)
    .filter((p): p is string => p != null);

  let photoUrls = new Map<string, string>();
  if (photoPaths.length > 0) {
    const supabase = await createClient();
    photoUrls = await getSignedAttachmentUrls(supabase, photoPaths);
  }

  return (
    <div>
      <SymptomModal action={boundCreateSymptomEntry} />
      {symptoms.length === 0 ? (
        <div className="empty-state">No symptoms logged for {pet.name} yet.</div>
      ) : (
        <div className="symptom-list">
          {symptoms.map((s) => (
            <SymptomRow
              key={s.id}
              symptom={s}
              photoUrl={s.photo_path ? photoUrls.get(s.photo_path) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
