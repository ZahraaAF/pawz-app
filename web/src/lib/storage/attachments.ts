import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { createClient } from "@/lib/supabase/server";

// Shared, reusable bucket for any pet-scoped file upload. Symptom photos
// are the first user; the Documents phase should reuse this unchanged,
// only widening ALLOWED_PHOTO_MIME_TYPES-equivalent server-side checks
// and the bucket's allowed_mime_types (see 0005_symptoms.sql).
export const PET_ATTACHMENTS_BUCKET = "pet-attachments";

// 10MiB, matching the Documents phase's spec'd default file-size limit -
// reused here since symptom photos are the same class of attachment.
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

export const ALLOWED_PHOTO_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/heic",
  "image/heif",
];

function extFromFilename(filename: string): string {
  const dot = filename.lastIndexOf(".");
  if (dot === -1 || dot === filename.length - 1) return "bin";
  return filename.slice(dot + 1).toLowerCase();
}

// Path convention: {petId}/{category}/{id}.{ext}. The leading {petId}
// segment is what the storage.objects RLS policies (0005_symptoms.sql)
// parse via storage.foldername(name)[1] to confirm pet ownership.
export function buildAttachmentPath(
  petId: string,
  category: string,
  id: string,
  originalFilename: string,
): string {
  return `${petId}/${category}/${id}.${extFromFilename(originalFilename)}`;
}

// @supabase/supabase-js's Storage sub-client is built once with a static
// headers snapshot taken at SupabaseClient construction time - unlike
// Postgrest (`.from()`), which re-resolves the current access token on
// every request via an `accessToken` callback (see supabase-js's
// SupabaseClient.ts: `this.storage = new SupabaseStorageClient(...,
// this.headers, ...)` vs. `accessToken: this._getAccessToken.bind(this)`
// passed to postgrest-js). A server client built via @supabase/ssr's
// createClient() constructs before its cookie-based session has hydrated,
// so `.storage` on that client silently authenticates as just the anon
// key forever, no matter who's logged in - Storage RLS then denies every
// write/read as an anonymous request, even though `.from()` on the same
// client instance correctly resolves auth.uid(). Work around it by
// building a one-off client pinned to the real, resolved user access
// token, used only for Storage calls.
async function getAuthedStorage(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    session
      ? { global: { headers: { Authorization: `Bearer ${session.access_token}` } } }
      : undefined,
  ).storage;
}

export async function uploadAttachment(
  supabase: Awaited<ReturnType<typeof createClient>>,
  path: string,
  file: File,
) {
  const storage = await getAuthedStorage(supabase);
  return storage.from(PET_ATTACHMENTS_BUCKET).upload(path, file, { contentType: file.type });
}

export async function removeAttachments(
  supabase: Awaited<ReturnType<typeof createClient>>,
  paths: string[],
) {
  const storage = await getAuthedStorage(supabase);
  return storage.from(PET_ATTACHMENTS_BUCKET).remove(paths);
}

// Bucket is private, so a stored photo_path is only useful to render
// via a short-lived signed URL, never a public one.
export async function getSignedAttachmentUrls(
  supabase: Awaited<ReturnType<typeof createClient>>,
  paths: string[],
  expiresIn = 3600,
): Promise<Map<string, string>> {
  const urls = new Map<string, string>();
  if (paths.length === 0) return urls;

  const storage = await getAuthedStorage(supabase);
  const { data, error } = await storage
    .from(PET_ATTACHMENTS_BUCKET)
    .createSignedUrls(paths, expiresIn);

  if (error) throw error;

  for (const entry of data ?? []) {
    if (entry.signedUrl && !entry.error) {
      urls.set(entry.path ?? "", entry.signedUrl);
    }
  }
  return urls;
}
