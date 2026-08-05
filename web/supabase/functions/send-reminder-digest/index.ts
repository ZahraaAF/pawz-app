// Daily digest email: "what's due in the next N days," one email per owner.
// Invoked by pg_cron (see migration 0003_reminder_notifications.sql) via
// net.http_post, authenticated with a bespoke shared secret rather than
// Supabase's default JWT check - the default would accept ANY valid
// Supabase JWT, including an ordinary logged-in user's session token, which
// isn't the access control we want for an internal cron webhook. See
// config.toml's [functions.send-reminder-digest] verify_jwt = false.
//
// Date math is duplicated (not imported) from web/src/lib/reminders/format.ts
// - Edge Functions run on Deno with no @/* path-alias resolution into the
// Next.js app. Same tradeoff already made for CARE_EVENT_TYPES between
// 0002_reminders.sql and lib/reminders/types.ts - keep in sync by hand.
import { createClient } from "npm:@supabase/supabase-js@2";

const N_DAYS = 3;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function parseDateUtc(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

function todayIsoUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDaysToIso(dateIso: string, days: number): string {
  return new Date(parseDateUtc(dateIso) + days * MS_PER_DAY).toISOString().slice(0, 10);
}

type ReminderRow = {
  id: string;
  label: string;
  next_due_on: string;
  last_notified_for_due_on: string | null;
  pets: { name: string; owner_id: string };
};

Deno.serve(async (req) => {
  const cronSecret = Deno.env.get("CRON_INVOKE_SECRET");
  const authHeader = req.headers.get("Authorization");
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const today = todayIsoUtc();
  const windowEnd = addDaysToIso(today, N_DAYS);

  // Range, not strict equality to today+N: the dedup check below already
  // guarantees at most one email per distinct next_due_on value, so a wider
  // window costs nothing and means a single missed/failed cron run can't
  // permanently skip a reminder that was exactly N days out that day.
  const { data, error } = await supabase
    .from("reminder_schedules")
    .select(
      "id, label, next_due_on, last_notified_for_due_on, pets!inner(name, owner_id, archived)",
    )
    .eq("active", true)
    .eq("pets.archived", false)
    .gte("next_due_on", today)
    .lte("next_due_on", windowEnd);

  if (error) {
    console.error("reminder_schedules query failed", error);
    return new Response("Query failed", { status: 500 });
  }

  const due = (data ?? []) as unknown as ReminderRow[];
  const eligible = due.filter((r) => r.last_notified_for_due_on !== r.next_due_on);

  const byOwner = new Map<string, ReminderRow[]>();
  for (const r of eligible) {
    const list = byOwner.get(r.pets.owner_id) ?? [];
    list.push(r);
    byOwner.set(r.pets.owner_id, list);
  }

  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  // Resend sandbox sender until a custom domain is verified - confirm the
  // current exact value in the Resend dashboard if this ever bounces.
  const fromAddress = Deno.env.get("RESEND_FROM_EMAIL") ?? "Pawz <onboarding@resend.dev>";

  let sent = 0;
  let failed = 0;

  for (const [ownerId, reminders] of byOwner) {
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(ownerId);
    const email = userData?.user?.email;
    if (userError || !email) {
      console.error(`could not resolve email for owner ${ownerId}`, userError);
      failed++;
      continue;
    }

    const lines = reminders
      .map((r) => `${r.pets.name} — ${r.label} — due ${r.next_due_on}`)
      .join("\n");
    const text = `Coming up in the next ${N_DAYS} days:\n\n${lines}\n\n— Pawz`;

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [email],
        subject: "Upcoming pet care reminders",
        text,
      }),
    });

    if (!resendRes.ok) {
      console.error(`Resend send failed for owner ${ownerId}`, await resendRes.text());
      failed++;
      continue;
    }

    // Immediately after THIS owner's own successful send, not batched at
    // the end - if the function crashes partway through a run, everyone
    // already processed keeps their dedup state, and whoever wasn't
    // reached yet just retries cleanly on tomorrow's run.
    const { error: markError } = await supabase.rpc("mark_reminders_notified", {
      reminder_ids: reminders.map((r) => r.id),
    });
    if (markError) {
      console.error(`mark_reminders_notified failed for owner ${ownerId}`, markError);
      failed++;
      continue;
    }

    sent++;
  }

  return new Response(JSON.stringify({ eligibleReminders: eligible.length, sent, failed }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
