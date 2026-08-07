-- Fixes a real bug in 0005_symptoms.sql's storage.objects RLS policies:
-- the bare column reference `name` inside `exists (select 1 from pets
-- where pets.id::text = (storage.foldername(name))[1] ...)` was resolved
-- by Postgres to `pets.name` (the pet's *name*, e.g. "Max") rather than
-- `storage.objects.name` (the object's path) - `pets` is the innermost
-- table in scope inside the EXISTS subquery, and it happens to have its
-- own `name` column, silently shadowing the outer table's column of the
-- same name. storage.foldername('Max') obviously never matches a real
-- pet id, so every select/insert/delete against the bucket was silently
-- denied by RLS, always, for every user - caught during Phase F QA when
-- a real (not mocked) photo upload consistently failed with "new row
-- violates row-level security policy" despite auth.uid() independently
-- confirmed correct via a debug RPC. Fix: qualify the column explicitly
-- as storage.objects.name so it can't be shadowed.

drop policy "pet_attachments_select_own" on storage.objects;
drop policy "pet_attachments_insert_own" on storage.objects;
drop policy "pet_attachments_delete_own" on storage.objects;

create policy "pet_attachments_select_own" on storage.objects
  for select using (
    bucket_id = 'pet-attachments'
    and exists (
      select 1 from pets
      where pets.id::text = (storage.foldername(storage.objects.name))[1]
      and pets.owner_id = auth.uid()
    )
  );
create policy "pet_attachments_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'pet-attachments'
    and exists (
      select 1 from pets
      where pets.id::text = (storage.foldername(storage.objects.name))[1]
      and pets.owner_id = auth.uid()
    )
  );
create policy "pet_attachments_delete_own" on storage.objects
  for delete using (
    bucket_id = 'pet-attachments'
    and exists (
      select 1 from pets
      where pets.id::text = (storage.foldername(storage.objects.name))[1]
      and pets.owner_id = auth.uid()
    )
  );
