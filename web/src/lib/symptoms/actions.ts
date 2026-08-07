"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/dal";
import {
  ALLOWED_PHOTO_MIME_TYPES,
  MAX_PHOTO_BYTES,
  buildAttachmentPath,
  removeAttachments,
  uploadAttachment,
} from "@/lib/storage/attachments";
import { SYMPTOM_SEVERITIES, type SymptomSeverity } from "./types";

export type FormState = { error: string } | { success: string } | null;

const SEVERITY_VALUES = SYMPTOM_SEVERITIES.map((s) => s.value) as [
  SymptomSeverity,
  ...SymptomSeverity[],
];

const symptomSchema = z.object({
  description: z.string().trim().min(1, "Description is required."),
  occurred_at: z.string().min(1, "Date and time are required."),
  severity: z.enum(SEVERITY_VALUES),
});

export async function createSymptomEntry(
  petId: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();

  const parsed = symptomSchema.safeParse({
    description: formData.get("description"),
    occurred_at: formData.get("occurred_at"),
    severity: formData.get("severity"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  // occurred_at comes from a <input type="datetime-local"> value, which
  // has no timezone offset - `new Date(...)` correctly interprets that as
  // *local* time (not UTC), unlike reminders/format.ts's parseDateUtc,
  // which exists specifically for date-only strings. Don't route this
  // through that helper - it would silently corrupt the time-of-day.
  const occurredAt = new Date(parsed.data.occurred_at);
  if (Number.isNaN(occurredAt.getTime())) {
    return { error: "Invalid date/time." };
  }
  if (occurredAt.getTime() > Date.now()) {
    return { error: "Date/time can't be in the future." };
  }

  const supabase = await createClient();

  // RLS would also block an insert/upload for a pet that isn't the
  // caller's, but checking ownership explicitly first gives a real error
  // message instead of an opaque RLS denial - and avoids doing a wasted
  // Storage upload for a request that's doomed anyway.
  const { data: pet } = await supabase
    .from("pets")
    .select("id")
    .eq("id", petId)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!pet) {
    return { error: "Pet not found." };
  }

  const id = crypto.randomUUID();
  let photoPath: string | null = null;

  const photo = formData.get("photo");
  if (photo instanceof File && photo.size > 0) {
    if (photo.size > MAX_PHOTO_BYTES) {
      return { error: "Photo must be under 10MB." };
    }
    if (!ALLOWED_PHOTO_MIME_TYPES.includes(photo.type)) {
      return { error: "Photo must be a JPG, PNG, or HEIC image." };
    }

    photoPath = buildAttachmentPath(petId, "symptoms", id, photo.name);
    const { error: uploadError } = await uploadAttachment(supabase, photoPath, photo);

    if (uploadError) {
      return { error: uploadError.message };
    }
  }

  const { error: insertError } = await supabase.from("symptom_entries").insert({
    id,
    pet_id: petId,
    description: parsed.data.description,
    occurred_at: occurredAt.toISOString(),
    severity: parsed.data.severity,
    photo_path: photoPath,
  });

  if (insertError) {
    if (photoPath) {
      // Best-effort cleanup - an orphaned object is a smaller problem
      // than surfacing a second error on top of the first to the user.
      await removeAttachments(supabase, [photoPath]);
    }
    return { error: insertError.message };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/pets/${petId}`);
  return { success: "Symptom logged." };
}
