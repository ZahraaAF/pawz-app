-- Phase: Documents (SPEC reqs 25-27). Reuses the pet-attachments bucket
-- and web/src/lib/storage/attachments.ts unchanged (per that file's
-- header comment), only widening the MIME allowlist for PDFs.

create table documents (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references pets (id) on delete cascade,

  -- Storage object path (not a URL) - bucket is private, URLs are
  -- signed on read. Same convention as symptom_entries.photo_path.
  file_path text not null,
  -- Original filename, kept separately from file_path (which is
  -- {petId}/documents/{id}.{ext}) so the UI/downloads show the name the
  -- founder actually recognizes, not a UUID.
  filename text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0),

  -- Optional link to exactly one existing record. Two nullable FKs, not
  -- a polymorphic (type, id) pair, so Postgres enforces referential
  -- integrity and on delete set null for free - deleting a linked care
  -- event or symptom entry leaves the document intact, just unlinked.
  care_event_id uuid references care_events (id) on delete set null,
  symptom_entry_id uuid references symptom_entries (id) on delete set null,

  created_at timestamptz not null default now(),

  constraint documents_at_most_one_link
    check (num_nonnulls(care_event_id, symptom_entry_id) <= 1)

  -- No check constraint mirrors size/type here - both are already
  -- hard-enforced upstream by the Storage bucket itself
  -- (file_size_limit, allowed_mime_types below), which rejects the
  -- upload before any insert is attempted. A duplicate constraint would
  -- just be a second allowlist to keep in sync for no added protection.

  -- No composite FK enforcing "the linked record belongs to this pet" -
  -- same unenforced gap as care_events.schedule_id -> reminder_schedules,
  -- relied on an explicit check in lib/documents/actions.ts instead,
  -- matching that existing precedent.
);

create index documents_pet_id_idx on documents (pet_id);

alter table documents enable row level security;

-- select/insert/delete, no update - Documents is the app's first real
-- delete UI, but otherwise mirrors symptom_entries/care_events: a
-- corrected upload is delete + re-upload, not an edit.
create policy "documents_select_own" on documents
  for select using (
    exists (select 1 from pets where pets.id = documents.pet_id and pets.owner_id = auth.uid())
  );
create policy "documents_insert_own" on documents
  for insert with check (
    exists (select 1 from pets where pets.id = documents.pet_id and pets.owner_id = auth.uid())
  );
create policy "documents_delete_own" on documents
  for delete using (
    exists (select 1 from pets where pets.id = documents.pet_id and pets.owner_id = auth.uid())
  );

-- Widen the shared bucket's MIME allowlist to include PDFs. No
-- storage.objects RLS changes needed - the policies fixed in
-- 0006_fix_pet_attachments_rls.sql are generic per-object ownership
-- checks, not per-category.
update storage.buckets
set allowed_mime_types = array['image/jpeg', 'image/png', 'image/heic', 'image/heif', 'application/pdf']
where id = 'pet-attachments';
