-- Phase E2 follow-up: the first-ever natural cron tick (2026-08-06 12:00 UTC)
-- timed out at pg_net's default 5000ms, even though the function had nothing
-- to send that run - a cold Edge Function boot (Deno resolving the
-- npm:@supabase/supabase-js specifier fresh) alone can exceed 5s. Since this
-- function only runs once a day, it will realistically be cold on every
-- invocation in production, so this would time out the same way every time.
-- cron.job_run_details still shows "succeeded" in that case, because that
-- only reflects net.http_post's synchronous enqueue step, not the async
-- HTTP call - so this failure mode is otherwise invisible without querying
-- net._http_response directly.
select cron.alter_job(
  (select jobid from cron.job where jobname = 'send-reminder-digest-daily'),
  command := $$
  select net.http_post(
    url := 'https://njrniyaxeqtqwbpwyncc.functions.supabase.co/send-reminder-digest',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (
        select decrypted_secret from vault.decrypted_secrets
        where name = 'cron_digest_invoke_secret'
      ),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
  $$
);
