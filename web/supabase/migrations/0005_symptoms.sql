-- Phase F: symptom log + a reusable pet-attachments storage bucket for
-- (optional) symptom photos. Same pet_id -> pets ownership join pattern
-- as pet_weights (0001) and care_events (0002).

-- `severity` is text + a check constraint, not a Postgres enum, for the
-- same reason as care_events.type in 0002: cheap `alter table` vs. an
-- enum's ceremony. Duplicated in web/src/lib/symptoms/types.ts
-- (SYMPTOM_SEVERITIES) - keep both in sync.

create table symptom_entries (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references pets (id) on delete cascade,
  description text not null,
  -- Full timestamp, not a date: spec asks for date *and* time, unlike
  -- care_events.occurred_on / pet_weights.logged_on.
  occurred_at timestamptz not null,
  severity text not null check (severity in ('mild', 'moderate', 'severe')),
  -- Object path within the `pet-attachments` bucket below, not a full
  -- URL - the bucket is private, so URLs are signed on read. Null when
  -- no photo was attached.
  photo_path text,
  created_at timestamptz not null default now()
);

create index symptom_entries_pet_id_idx on symptom_entries (pet_id);
create index symptom_entries_occurred_at_idx on symptom_entries (occurred_at desc);

alter table symptom_entries enable row level security;

-- Mirrors care_events: select/insert/delete, no update (correcting an
-- entry means delete + re-add). No "undo" UI ships this slice, so
-- delete is only reachable via direct SQL for now - the policy exists
-- for parity with that same accepted gap.
create policy "symptom_entries_select_own" on symptom_entries
  for select using (
    exists (select 1 from pets where pets.id = symptom_entries.pet_id and pets.owner_id = auth.uid())
  );
create policy "symptom_entries_insert_own" on symptom_entries
  for insert with check (
    exists (select 1 from pets where pets.id = symptom_entries.pet_id and pets.owner_id = auth.uid())
  );
create policy "symptom_entries_delete_own" on symptom_entries
  for delete using (
    exists (select 1 from pets where pets.id = symptom_entries.pet_id and pets.owner_id = auth.uid())
  );

-- ---- Storage: shared, reusable bucket for pet attachments ----
-- One bucket for symptom photos now, Documents (a later phase) later -
-- that phase should reuse this bucket and web/src/lib/storage/attachments.ts
-- unchanged, only widening allowed_mime_types (e.g. + application/pdf).
-- Path convention: {pet_id}/{category}/{id}.{ext}, e.g.
-- "3f2c.../symptoms/9a1b....jpg" - RLS below parses the leading path
-- segment back to pets.owner_id, the same join pattern as every table
-- above and in prior migrations.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'pet-attachments',
  'pet-attachments',
  false,
  10485760, -- 10MiB, matching the Documents phase's spec'd default, reused here
  array['image/jpeg', 'image/png', 'image/heic', 'image/heif']
)
on conflict (id) do nothing;

-- storage.objects ships with RLS already enabled on every Supabase
-- project; we only add policies. No update policy: a replaced photo is
-- a new object at a new path, not an in-place overwrite.
create policy "pet_attachments_select_own" on storage.objects
  for select using (
    bucket_id = 'pet-attachments'
    and exists (
      select 1 from pets
      where pets.id::text = (storage.foldername(name))[1]
      and pets.owner_id = auth.uid()
    )
  );
create policy "pet_attachments_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'pet-attachments'
    and exists (
      select 1 from pets
      where pets.id::text = (storage.foldername(name))[1]
      and pets.owner_id = auth.uid()
    )
  );
create policy "pet_attachments_delete_own" on storage.objects
  for delete using (
    bucket_id = 'pet-attachments'
    and exists (
      select 1 from pets
      where pets.id::text = (storage.foldername(name))[1]
      and pets.owner_id = auth.uid()
    )
  );
