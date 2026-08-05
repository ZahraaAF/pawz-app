-- Phase E2: daily reminder-digest email (Edge Function + pg_cron + Resend).
-- See web/supabase/functions/send-reminder-digest for the function itself.

-- Nullable, compared against the *live* next_due_on (not a boolean flag) so
-- a reminder re-arms itself automatically whenever its due date changes -
-- e.g. markReminderDone() advancing a recurring reminder's next_due_on, or
-- a future due-date edit feature - with no extra reset logic anywhere.
alter table reminder_schedules
  add column last_notified_for_due_on date;

-- PostgREST's .update() can only set a column to a literal, not to another
-- column on the same row ("set last_notified_for_due_on = next_due_on"), so
-- the edge function calls this instead of a plain .update() after a
-- successful send. security invoker (default) is fine here: the edge
-- function calls it with the service-role key, which bypasses RLS; if an
-- ordinary user ever called it directly, reminder_schedules_update_own
-- still confines them to their own rows.
create or replace function mark_reminders_notified(reminder_ids uuid[])
returns void
language sql
as $$
  update reminder_schedules
  set last_notified_for_due_on = next_due_on
  where id = any(reminder_ids);
$$;

-- Not part of the app's normal Data API surface - only the edge function
-- (via the service-role key, which ignores grants) should call this.
revoke execute on function mark_reminders_notified(uuid[]) from public, anon, authenticated;

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Daily at 12:00 UTC - mid-day, away from any local-midnight boundary
-- ambiguity. The invocation secret is looked up by name from Vault at
-- call time, never embedded here - see ProjectNotes_Z.md for how it's set.
select cron.schedule(
  'send-reminder-digest-daily',
  '0 12 * * *',
  $$
  select net.http_post(
    url := 'https://njrniyaxeqtqwbpwyncc.functions.supabase.co/send-reminder-digest',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (
        select decrypted_secret from vault.decrypted_secrets
        where name = 'cron_digest_invoke_secret'
      ),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
