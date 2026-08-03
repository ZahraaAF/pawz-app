-- Pets + weight log, scoped per-account via RLS.

create type pet_species as enum ('dog', 'cat');
create type pet_sex as enum ('male', 'female');

create table pets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  species pet_species not null,
  breed text,
  dob date,
  estimated_age_label text,
  sex pet_sex,
  neutered boolean,
  allergies text,
  notes text,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint pets_dob_xor_estimated_age check (
    dob is null or estimated_age_label is null
  )
);

create index pets_owner_id_idx on pets (owner_id);

create table pet_weights (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references pets (id) on delete cascade,
  value numeric not null check (value > 0),
  unit text not null check (unit in ('kg', 'lb')),
  logged_on date not null,
  created_at timestamptz not null default now()
);

create index pet_weights_pet_id_idx on pet_weights (pet_id);

-- Most recent weight per pet, ordered by the vet-visit date it was logged
-- for (not insertion order) so backfilled entries sort correctly.
create view pet_current_weight
  with (security_invoker = true) as
select distinct on (pet_id)
  pet_id,
  value,
  unit,
  logged_on
from pet_weights
order by pet_id, logged_on desc, created_at desc;

alter table pets enable row level security;
alter table pet_weights enable row level security;

create policy "pets_select_own" on pets
  for select using (owner_id = auth.uid());
create policy "pets_insert_own" on pets
  for insert with check (owner_id = auth.uid());
create policy "pets_update_own" on pets
  for update using (owner_id = auth.uid());
create policy "pets_delete_own" on pets
  for delete using (owner_id = auth.uid());

-- pet_weights is an immutable log: select/insert/delete only, no update
-- policy (correcting an entry means delete + re-add).
create policy "pet_weights_select_own" on pet_weights
  for select using (
    exists (select 1 from pets where pets.id = pet_weights.pet_id and pets.owner_id = auth.uid())
  );
create policy "pet_weights_insert_own" on pet_weights
  for insert with check (
    exists (select 1 from pets where pets.id = pet_weights.pet_id and pets.owner_id = auth.uid())
  );
create policy "pet_weights_delete_own" on pet_weights
  for delete using (
    exists (select 1 from pets where pets.id = pet_weights.pet_id and pets.owner_id = auth.uid())
  );

create function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger pets_set_updated_at
  before update on pets
  for each row
  execute function set_updated_at();
