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

function formatDateHuman(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

// Duplicated from CARE_EVENT_TYPES in web/src/lib/reminders/types.ts - same
// keep-in-sync tradeoff as the check constraint in 0002_reminders.sql.
const TYPE_LABELS: Record<string, string> = {
  vaccination: "Vaccination",
  medication: "Medication",
  deworming: "Deworming",
  flea_tick: "Flea & tick",
  grooming: "Grooming",
  vet_visit: "Vet visit",
  other: "Reminder",
};

type ReminderRow = {
  id: string;
  type: string;
  label: string;
  notes: string | null;
  next_due_on: string;
  last_notified_for_due_on: string | null;
  pets: { name: string; owner_id: string };
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Colors duplicated from web/src/app/globals.css's :root (light) palette -
// email clients strip <style>/CSS custom properties unreliably, so this has
// to be plain hex inlined per element, not a shared stylesheet.
const COLOR = {
  teal: "#1c6b6b",
  marigold: "#b8721f",
  paper: "#efeadf",
  paperCard: "#f8f6ee",
  ink: "#1c231e",
  inkSoft: "#4c5650",
  inkFaint: "#7c847d",
  line: "#dcd5c3",
};

// Table-based layout, all styles inlined - the only markup shape that
// renders consistently across email clients (Outlook in particular ignores
// most modern CSS, including flexbox/grid and external/head-level styles).
function buildHtml(reminders: ReminderRow[]): string {
  const rows = reminders
    .map((r) => {
      const typeLabel = escapeHtml(TYPE_LABELS[r.type] ?? "Reminder");
      const petName = escapeHtml(r.pets.name);
      const label = escapeHtml(r.label);
      const due = formatDateHuman(r.next_due_on);
      const notesRow = r.notes
        ? `<tr><td style="padding:3px 0;color:${COLOR.inkFaint};font-size:13px;width:96px;vertical-align:top;">Notes</td><td style="padding:3px 0;color:${COLOR.inkSoft};font-size:13px;">${escapeHtml(r.notes)}</td></tr>`
        : "";
      return `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-family:-apple-system,'Segoe UI',Roboto,sans-serif;border-top:1px solid ${COLOR.line};padding-top:14px;margin-top:14px;">
          <tr><td style="padding:3px 0;color:${COLOR.inkFaint};font-size:13px;width:96px;">Pet Name</td><td style="padding:3px 0;color:${COLOR.ink};font-size:14px;font-weight:600;">${petName}</td></tr>
          <tr><td style="padding:3px 0;color:${COLOR.inkFaint};font-size:13px;">${typeLabel}</td><td style="padding:3px 0;color:${COLOR.ink};font-size:14px;">${label}</td></tr>
          <tr><td style="padding:3px 0;color:${COLOR.inkFaint};font-size:13px;">Due</td><td style="padding:3px 0;color:${COLOR.marigold};font-size:14px;font-weight:600;">${due}</td></tr>
          ${notesRow}
        </table>`;
    })
    .join("");

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLOR.paper};padding:24px 0;">
      <tr><td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:${COLOR.paperCard};border:1px solid ${COLOR.line};border-radius:16px;">
          <tr><td style="padding:28px 32px 4px;">
            <div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;color:${COLOR.teal};">Pawz</div>
            <div style="font-family:-apple-system,'Segoe UI',Roboto,sans-serif;font-size:14px;color:${COLOR.inkFaint};margin-top:4px;">Coming up in the next ${N_DAYS} days</div>
          </td></tr>
          <tr><td style="padding:4px 32px 24px;">${rows}</td></tr>
          <tr><td style="padding:0 32px 24px;font-family:-apple-system,'Segoe UI',Roboto,sans-serif;font-size:12px;color:${COLOR.inkFaint};">— Pawz</td></tr>
        </table>
      </td></tr>
    </table>`;
}

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
      "id, type, label, notes, next_due_on, last_notified_for_due_on, pets!inner(name, owner_id, archived)",
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

    const blocks = reminders.map((r) => {
      const typeLabel = TYPE_LABELS[r.type] ?? "Reminder";
      const block = [
        `Pet Name: ${r.pets.name}`,
        `${typeLabel}: ${r.label}`,
        `Due: ${formatDateHuman(r.next_due_on)}`,
      ];
      if (r.notes) block.push(`Notes: ${r.notes}`);
      return block.join("\n");
    });
    // Plain-text fallback for clients that don't render HTML - Resend sends
    // both parts in one request (multipart), same email either way.
    const text = `Coming up in the next ${N_DAYS} days:\n\n${blocks.join("\n\n")}\n\n— Pawz`;
    const html = buildHtml(reminders);

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
        html,
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
