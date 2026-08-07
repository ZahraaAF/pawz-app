"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/dal";
import {
  ALLOWED_DOCUMENT_MIME_TYPES,
  MAX_PHOTO_BYTES,
  buildAttachmentPath,
  removeAttachments,
  uploadAttachment,
} from "@/lib/storage/attachments";

export type FormState = { error: string } | { success: string } | null;

// The optional link travels as one atomic field ("none" |
// "care_event:<uuid>" | "symptom_entry:<uuid>") rather than a separate
// kind + id pair that could disagree with each other.
function parseLink(raw: FormDataEntryValue | null): {
  careEventId: string | null;
  symptomEntryId: string | null;
} {
  const value = typeof raw === "string" ? raw : "none";
  if (value === "none") return { careEventId: null, symptomEntryId: null };

  const [kind, id] = value.split(":");
  if (kind === "care_event" && id) return { careEventId: id, symptomEntryId: null };
  if (kind === "symptom_entry" && id) return { careEventId: null, symptomEntryId: id };
  return { careEventId: null, symptomEntryId: null };
}

export async function uploadDocument(
  petId: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const { careEventId, symptomEntryId } = parseLink(formData.get("link"));

  const supabase = await createClient();

  // Explicit ownership check before touching Storage - same reasoning
  // as symptoms/actions.ts: a real error message, no wasted upload for
  // a request that's doomed anyway.
  const { data: pet } = await supabase
    .from("pets")
    .select("id")
    .eq("id", petId)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!pet) {
    return { error: "Pet not found." };
  }

  // The schema doesn't enforce "the linked record belongs to this pet"
  // (same unenforced gap as care_events.schedule_id elsewhere) - check
  // explicitly instead.
  if (careEventId) {
    const { data } = await supabase
      .from("care_events")
      .select("id")
      .eq("id", careEventId)
      .eq("pet_id", petId)
      .maybeSingle();
    if (!data) return { error: "Selected care event not found." };
  }
  if (symptomEntryId) {
    const { data } = await supabase
      .from("symptom_entries")
      .select("id")
      .eq("id", symptomEntryId)
      .eq("pet_id", petId)
      .maybeSingle();
    if (!data) return { error: "Selected symptom entry not found." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Please choose a file." };
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return { error: "File must be under 10MB." };
  }
  if (!ALLOWED_DOCUMENT_MIME_TYPES.includes(file.type)) {
    return { error: "File must be a JPG, PNG, HEIC, or PDF." };
  }

  const id = crypto.randomUUID();
  const filePath = buildAttachmentPath(petId, "documents", id, file.name);
  const { error: uploadError } = await uploadAttachment(supabase, filePath, file);
  if (uploadError) {
    return { error: uploadError.message };
  }

  const { error: insertError } = await supabase.from("documents").insert({
    id,
    pet_id: petId,
    file_path: filePath,
    filename: file.name,
    mime_type: file.type,
    size_bytes: file.size,
    care_event_id: careEventId,
    symptom_entry_id: symptomEntryId,
  });

  if (insertError) {
    // Best-effort cleanup - an orphaned object is a smaller problem
    // than surfacing a second error on top of the first to the user.
    await removeAttachments(supabase, [filePath]);
    return { error: insertError.message };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/pets/${petId}`);
  return { success: "Document uploaded." };
}

// Plain <form action={deleteDocument.bind(null, id)}> (see
// DocumentDeleteButton.tsx) needs a (formData) => Promise<void> shape,
// not FormState - matches reminders/actions.ts's markReminderDone /
// cancelReminder convention (throw on error) rather than
// useActionState's error/success object, since there's no dedicated
// error-banner UI for a delete button.
export async function deleteDocument(documentId: string): Promise<void> {
  await requireUser();
  const supabase = await createClient();

  // Fetch first - RLS makes a non-owned id resolve to null here for
  // free, giving a clean error instead of an opaque RLS denial, and we
  // need file_path/pet_id anyway.
  const { data: doc } = await supabase
    .from("documents")
    .select("id, pet_id, file_path")
    .eq("id", documentId)
    .maybeSingle();

  if (!doc) {
    throw new Error("Document not found.");
  }

  // DB row first, Storage object second - the reverse of upload's
  // order. If Storage cleanup fails after a successful DB delete, the
  // result is an invisible orphaned blob (harmless). The opposite order
  // risks a *visibly listed* row pointing at a file that no longer
  // exists - a broken View/Download link the user can see, which is
  // worse than an invisible orphan.
  const { error: deleteError } = await supabase.from("documents").delete().eq("id", documentId);
  if (deleteError) {
    throw deleteError;
  }

  await removeAttachments(supabase, [doc.file_path]);

  revalidatePath("/dashboard");
  revalidatePath(`/pets/${doc.pet_id}`);
}
