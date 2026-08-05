-- Care events + reminder schedules, scoped per-account via RLS.
-- Same pet_id -> pets ownership join pattern as pet_weights in 0001.

-- `type` is text + a check constraint, not a Postgres enum: care-event
-- categories are far more likely to gain/rename values than
-- pets.species/pets.sex, and a check constraint is a cheap `alter table`
-- vs. an enum's ceremony to change. This list is duplicated in
-- web/src/lib/reminders/types.ts (CARE_EVENT_TYPES) - keep both in sync.

create table reminder_schedules (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references pets (id) on delete cascade,
  type text not null check (type in (
    'vaccination', 'medication', 'deworming', 'flea_tick', 'grooming', 'vet_visit', 'other'
  )),
  label text not null,
  notes text,
  is_recurring boolean not null default false,
  interval_days integer,
  next_due_on date not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint reminder_schedules_interval_matches_recurring check (
    (is_recurring and interval_days is not null and interval_days > 0)
    or (not is_recurring and interval_days is null)
  )
);

create index reminder_schedules_pet_id_idx on reminder_schedules (pet_id);
-- Partial index: only active rows are ever queried by due date.
create index reminder_schedules_active_next_due_on_idx
  on reminder_schedules (next_due_on) where active;

create table care_events (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references pets (id) on delete cascade,
  -- Nullable: a logged event may or may not be tied to a schedule
  -- (see logCareEvent vs. markReminderDone in lib/reminders/actions.ts).
  -- on delete set null (not cascade) so history survives even if the
  -- schedule row it came from is ever removed.
  schedule_id uuid references reminder_schedules (id) on delete set null,
  type text not null check (type in (
    'vaccination', 'medication', 'deworming', 'flea_tick', 'grooming', 'vet_visit', 'other'
  )),
  -- Denormalized copy of the schedule's label at log time, so history
  -- still reads sensibly if the schedule is later changed.
  label text not null,
  occurred_on date not null,
  notes text,
  created_at timestamptz not null default now()
);

create index care_events_pet_id_idx on care_events (pet_id);
create index care_events_occurred_on_idx on care_events (occurred_on desc);

alter table reminder_schedules enable row level security;
alter table care_events enable row level security;

create policy "reminder_schedules_select_own" on reminder_schedules
  for select using (
    exists (select 1 from pets where pets.id = reminder_schedules.pet_id and pets.owner_id = auth.uid())
  );
create policy "reminder_schedules_insert_own" on reminder_schedules
  for insert with check (
    exists (select 1 from pets where pets.id = reminder_schedules.pet_id and pets.owner_id = auth.uid())
  );
create policy "reminder_schedules_update_own" on reminder_schedules
  for update using (
    exists (select 1 from pets where pets.id = reminder_schedules.pet_id and pets.owner_id = auth.uid())
  );

-- care_events mirrors pet_weights: select/insert/delete, no update
-- (correcting an entry means delete + re-add). No "undo" UI ships this
-- slice, so delete is only reachable via direct SQL for now.
create policy "care_events_select_own" on care_events
  for select using (
    exists (select 1 from pets where pets.id = care_events.pet_id and pets.owner_id = auth.uid())
  );
create policy "care_events_insert_own" on care_events
  for insert with check (
    exists (select 1 from pets where pets.id = care_events.pet_id and pets.owner_id = auth.uid())
  );
create policy "care_events_delete_own" on care_events
  for delete using (
    exists (select 1 from pets where pets.id = care_events.pet_id and pets.owner_id = auth.uid())
  );

create trigger reminder_schedules_set_updated_at
  before update on reminder_schedules
  for each row
  execute function set_updated_at();
