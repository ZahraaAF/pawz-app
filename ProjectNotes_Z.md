# Pawz — Project Notes

Living handoff doc: what's been built, why, and what's next. Updated at the end of each phase. For exact technical steps of the phase we're currently mid-way through, see the plan at `~/.claude/plans/hi-claude-inspect-the-wise-taco.md` — this file is the narrative companion, not a replacement.

Last updated: end of Phase F. Phases D, E1, E2, and F are all committed (locally; F not yet pushed — see "Next up"). Phase E2 needed one follow-up fix after the first natural overnight cron run surfaced a real bug — see "Phase E2" below. Phase F surfaced three more real bugs during QA — see "Phase F" below.

**Heads up for whoever reads this next:** there's clear evidence of another active Claude Code session working on this same codebase concurrently with the one that did Phase F (an in-progress, uncommitted UI refactor touching `WeightForm`/`WeightPanel`/`ReminderPanel`/`ReminderModal` plus a new `WeightModal.tsx`, and `HAIRBALL_LOG.md` — a new bug-tracking companion doc at the project root with an "Open" entry dated 2026-08-07 for the exact dev-server-crash issue Phase F's session independently ran into and resolved via restart). Phase F's commit deliberately left all of that untouched rather than guessing how to reconcile it. If you're starting a fresh session: check `git status` first, and check whether that other session is still running before touching those files.

---

## Phase 0 — Product spec + clickable mockup

**What:** `SPEC.md` (vision, personas, MVP scope) and `design/pawz-mvp-mockup.html` (single-file HTML/CSS/JS clickable prototype) — done in an earlier session, before any real code existed.

**Why it matters:** Everything built since is a direct port of decisions already validated here — the design system (colors, type, card shapes), the three core screens (Home, Profile, Care Card), and the MVP scope (pet profiles, reminders, timeline, symptom log, documents, Care Card — explicitly *not* marketplace/booking/community/AI features).

**Status:** Stable, not actively changing. Naming ("Pawz") is still just a codename — not finalized, deferred until closer to launch.

---

## Phase 0.5 — Next.js scaffold

**What:** `web/` created via `create-next-app` (Next.js 16, TypeScript, App Router, ESLint, no Tailwind). Reorganized the project folder so `SPEC.md` stays at the root, the mockup moved into `design/`, and the real app lives in `web/`. Git initialized once at the project root (not inside `web/`).

**Why it matters:** No Tailwind was a deliberate call — the mockup already has a complete, hand-built CSS design system, so adding Tailwind would just be two styling systems fighting each other.

**Gotcha hit along the way:** the npm cache (`~/.npm`) had files owned by `root` from some earlier `sudo npm install`, which broke the first install attempt. Fixed by Zee running `sudo chown -R $(whoami) ~/.npm` herself in a separate Terminal window (Claude Code's own shell can't handle interactive `sudo` password prompts).

---

## Phase 1 — Home dashboard ported to React

**What:** The mockup's Home screen (pet tiles, Overdue/Upcoming/Recently-logged reminders) rebuilt as real React components: `TopNav`, `PetTiles`, `ReminderList`, `RecentEventList`, backed by mock data in `lib/pets.ts` shaped like what Supabase will eventually return.

**Key decision:** Replaced the mockup's JS-driven view-switching (hidden/shown `<div>`s) with real Next.js routes (`/`, `/pets/[id]`, `/pets/[id]/care-card`) — more idiomatic for Next, and each screen becomes a real, shareable URL.

**Status — superseded by the plan, not lost:** Per the Phase A→D plan, this Home page will move to `(app)/dashboard` once auth exists, and the root `/` will become an auth redirect instead. The mock reminders data will also be stripped back to honest empty states ("Nothing due yet") in the real dashboard, since reminders aren't being built until a later slice — showing fabricated reminders once the app is "real" would be misleading.

**Known placeholder:** the top nav's Profile/Care Card tabs currently default to the first mock pet (Max), since there's no real "selected pet" concept yet without auth.

---

## Phase A — Supabase foundations

**What:**
- Migrated `web/` from npm to pnpm (matches `SPEC.md`'s chosen tooling) — `corepack enable`, removed `package-lock.json`, generated `pnpm-lock.yaml`.
- Created the actual Supabase project (Zee, manually, in the Supabase dashboard — region: West EU/Ireland).
- Linked the local repo to it via the Supabase CLI (`supabase init` + `supabase link`).
- Added `web/.env.local` (real keys, git-ignored) and `web/.env.local.example` (template, committed).
- Installed `@supabase/supabase-js`, `@supabase/ssr`, `zod`.
- Wrote `lib/supabase/client.ts` (browser client) and `lib/supabase/server.ts` (server client, bound fresh to Next's async `cookies()` per request — deliberately never a module-level singleton, which would leak one user's session into another's request).

**Why it matters:** This is pure plumbing — no login, no tables, no real data yet. It's the foundation Phase B (auth) and Phase D (pet CRUD) get built on top of.

**Verified as actually working (not just "files exist"):**
- Fresh `pnpm install --frozen-lockfile` succeeds → lockfile is reproducible.
- `tsc --noEmit` and `pnpm lint` both clean.
- A real query through the anon key reached the live Postgres database and got the expected "table doesn't exist" response — proves the URL + key genuinely authenticate, not just that the domain resolves.
- Dev server boots under pnpm, same Home page renders.

**Gotcha hit along the way:** Zee initially pasted what looked like her Supabase database password into chat, thinking it was a "project ID." Caught by decoding the anon key's JWT payload (which embeds the real project ref) and comparing — the two didn't match. She reset the password immediately as a precaution.

**Open item, low priority:** git is auto-guessing the commit author name/email from the Mac username ("Zahraa Fansofkar"). Harmless while nothing's pushed anywhere, but should be set properly (`git config --global user.name/user.email`) before the first push to GitHub.

---

## Phase B — Auth

**What:**
- `web/src/proxy.ts` (replaces `middleware.ts` — renamed in this Next.js version) — Supabase-backed session refresh + route protection. Redirects logged-out users away from `/dashboard`; redirects already-logged-in users away from `/login`/`/signup`/`/forgot-password`. `/reset-password` is deliberately excluded from that logged-in redirect, since it's reached via a recovery-link session, not a normal login.
- `web/src/lib/auth/dal.ts` — `getUser()`/`requireUser()` helper, called independently by every Server Action and data-fetching Server Component rather than trusting the proxy alone (a proxy matcher misconfiguration can silently stop covering a route).
- `web/src/app/(auth)/{login,signup,forgot-password,reset-password}/` — pages + colocated Server Actions (`signInWithPassword`, `signUp`, `resetPasswordForEmail`, `updateUser`).
- `web/src/app/auth/callback/route.ts` — handles Supabase's email confirmation / password-reset redirect links via `exchangeCodeForSession`.
- `web/src/lib/auth/actions.ts` — `signOut` as a plain form action.
- `web/src/app/page.tsx` — replaced the create-next-app boilerplate with an auth-aware redirect (`getUser()` → `/dashboard` or `/login`).

**Gotcha hit + fixed:** manual QA found that clicking a password-reset email link a *second* time (after it had already been used once) landed straight on the dashboard, fully logged in, instead of showing an expired-link error. Root cause: the first click's `exchangeCodeForSession` establishes a completely ordinary, persistent session — not a scoped "you may only reset your password" token. So on the second click, the recovery *code* correctly failed to re-exchange, but the still-valid session cookie left over from the first click made `proxy.ts`'s "already logged in → bounce off `/login`" rule silently swallow the intended error and redirect straight to `/dashboard` instead. The same root cause meant a *successful* reset also left the user in a standing session without the new password ever actually being used.
Fixed by: (1) `auth/callback/route.ts` now signs out before redirecting to `/login?error=auth-callback-failed` on a failed code exchange, so a stale/reused link can't ride on a leftover session; (2) `reset-password`'s `updateUser` action now signs out after a successful password change and redirects to `/login?message=password-updated`, so completing a reset requires actually logging in with the new password.

**Verified as actually working:**
- Added Vitest (`pnpm test`, first automated tests in this project) covering both fixes directly, plus a regression test locking in `proxy.ts`'s existing redirect rules — the exact interaction between two independently-reasonable rules is what caused the bug, so it's now guarded against regressing silently again.
- `tsc --noEmit` and `pnpm lint` both clean.
- Manually walked signup → email confirm → callback → dashboard, logout/login, and the full password-reset round-trip (including the reused-link case) in a real browser.

**Status:** Complete.

---

## Phase C — App shell

**What:** `web/src/components/Topbar.tsx` (replaces the mock-data `TopNav.tsx` from Phase 1) + `web/src/app/(app)/layout.tsx`, ported from the mockup's `.topbar`/`.nav-tab` styles. Wraps authenticated routes with persistent top navigation and a `signOut` form action.

**Status:** Complete.

---

## Phase D — Pet CRUD

**What:**
- `web/supabase/migrations/0001_pets_and_weights.sql` — `pets` + `pet_weights` tables, a `security_invoker` `pet_current_weight` view (latest weight per pet, ordered by `logged_on`/`created_at` so backfilled entries sort correctly, not insertion order), RLS on both tables scoped to `owner_id = auth.uid()`. A check constraint blocks a pet having both a `dob` and an `estimated_age_label` at the database level, not just in the form.
- `web/src/lib/pets/{types,queries,actions,color,format}.ts` — Zod-validated CRUD (`createPet`, `updatePet`, `archivePet`, `addWeightEntry`), an `emptyToNull` helper so blank form fields become real `NULL` (needed for "Unknown" styling to key off `value == null`), a deterministic per-pet accent color hash (`getPetAccentColor`) from a blue/purple/teal palette chosen to avoid clashing with the amber/brick/sage status-pill colors, and age/weight/unknown-field formatting helpers.
- Real dashboard (pet tiles + honest "Nothing due yet"/"No activity logged yet" empty states — reminders aren't built yet, so nothing is fabricated), `/pets/new`, `/pets/[petId]` (avatar-chip `PetSwitcher`, `ViewToggle` for Overview/Timeline/Actions, `FieldGrid` with Unknown-styling, `WeightPanel` with add-entry form + history), `/pets/[petId]/edit` (shared `PetForm` + Archive), `/care-card` placeholder so the topbar's Care Card tab has a real destination. Timeline/Actions render as "lands in a later update" stubs, preserving the mockup's shape without building symptom logs/documents/reports yet.

**Verified as actually working (not just "files exist"):**
- `tsc --noEmit`, `pnpm lint`, and the existing Vitest suite all clean throughout.
- Migration applied to the live Supabase project via `npx supabase db push`; confirmed live by querying `pets`/`pet_weights` with the anon key unauthenticated — empty result, no error, proving the tables exist and RLS is actively filtering rather than erroring.
- Went further than a browser click-through: created a throwaway Supabase test account, force-confirmed its email via direct `supabase db query --linked` (bypassing the need to click a real confirmation email), captured a real `@supabase/ssr` session cookie for it, and drove actual POST requests through every Server Action (create pet, log a weight, edit a pet, archive a pet) plus every page (dashboard, pet profile, edit, Care Card) against a throwaway `pnpm dev` instance on a spare port — all succeeded cleanly with real and empty data alike. Test account, its data, and the debug scripts were all deleted afterward.
- Zee then manually walked the full checklist herself in her own browser (clean-slate dog with full DOB, rescue cat with estimated age + blank fields showing "Unknown" styling correctly, backfilled out-of-order weight entries, edit, archive, pet switching, Care Card/Timeline/Actions placeholders) — all passed.

**Gotcha hit along the way:** Zee hit a plain-text "Internal Server Error" mid-session that didn't reproduce in any of the direct testing above (every Server Action and page loaded fine under a real session). Best explanation: her `pnpm dev` instance had been running continuously while a dozen-plus new files landed underneath it, and Turbopack's dev server got into a bad incremental-compile state. A plain restart (`pnpm dev` again) cleared it — worth remembering as a first troubleshooting step if this recurs after a large batch of file changes lands while the dev server is already running.

**Not built this slice (deliberately deferred):** the automated two-user RLS check (`web/scripts/verify-rls.mjs`) flagged in the original plan — the manual anon-key check plus the throwaway-account exercise above gave enough confidence for now; can revisit before this matters more (e.g. before real users' data is on the line).

**Status:** Complete, committed (`404f4bd`).

---

## Phase E1 — In-app reminders

**What:** Per SPEC's stated build order (auth → pet CRUD → reminders → symptom log/report → documents → Care Card), and per the plan at `~/.claude/plans/floating-foraging-diffie.md`: the in-app half of reminders (creating/logging/marking-done, real Overdue/Upcoming/Recently-logged sections). The email-digest half (Supabase Edge Function + Resend + cron) is deliberately deferred to a separate "Phase E2" plan — needs its own Resend account signup.

- `web/supabase/migrations/0002_reminders.sql` — `reminder_schedules` (forward-looking, `type` as text+check not enum since categories will churn) + `care_events` (immutable log, `schedule_id` nullable so standalone past events can be logged without any reminder), RLS via the same pets-ownership join pattern as `pet_weights`.
- `web/src/lib/reminders/{types,format,queries,actions}.ts` — mirrors `lib/pets/` exactly. Three distinct actions (`createReminder`, `logCareEvent`, `markReminderDone`) so no field ever means both "happened" and "will happen"; `markReminderDone` anchors the next occurrence to the actual completion date (today + interval), not the original due date. `cancelReminder` deactivates without logging. Cross-pet dashboard queries use `pets!inner(...).eq("pets.archived", false)` specifically to avoid leaking archived pets' reminders.
- New components: `ReminderForm`, `ReminderRow`, `ReminderPanel`, `LogEventForm`, `LogEventModal`, `Timeline` (replaces `TimelineStub`), `CollapsibleSection` (used to tuck Reminders into the pet profile's Overview tab). Dashboard and `PetTile` wired to show real Overdue/Upcoming/pill counts instead of the old placeholder copy.
- Dead code removed: old `lib/pets.ts` mock data, `PetTiles`, `ReminderList`, `RecentEventList`, `TimelineStub`.

**Verified as actually working:**
- `tsc --noEmit`, `pnpm lint`, `pnpm test` (24 tests) all clean.
- Migration `0002` confirmed live via `supabase migration list` (local=remote=0002).
- A throwaway Supabase test account — created pre-confirmed via the Admin API (service-role key fetched transiently through `supabase projects api-keys`, never written to disk, session-scoped only) rather than the signup form, since Supabase's default email sender rate-limits fast repeated signups — drove a full Playwright pass against a spare-port (`3399`) `pnpm dev` instance: two pets, a recurring overdue reminder, a one-off upcoming reminder, a standalone past care event, marking both reminder types done (verified `next_due_on` math and deactivation via direct SQL, not just the UI), cancelling a reminder, dashboard interleaving + pill counts across two pets, and the archive-leak fix (an archived pet's reminder disappears from the cross-pet dashboard but still shows on her own profile page). All 17 assertions passed on the first clean run. Test account and its data deleted afterward (cascades via `auth.users` FK); the throwaway `scripts/qa-reminders.mjs` and the temporary `playwright` devDependency were both removed after the run — `git status` on `package.json`/`pnpm-lock.yaml` is clean.

**Not done yet:** Zee's own manual browser walkthrough, and committing the change.

---

## Phase E2 — Reminder email digest

**What:** The other half of FR#17 ("Email reminder N days before due, default 3"). Per plan `~/.claude/plans/jaunty-cuddling-flute.md`: one daily digest email per owner (not one email per reminder), listing everything due in the next 3 days across all their pets, sent unattended by a Supabase Edge Function on a `pg_cron` schedule.

- `web/supabase/migrations/0003_reminder_notifications.sql` — adds `reminder_schedules.last_notified_for_due_on` (nullable date, compared against the *live* `next_due_on` rather than a boolean flag, so a reminder re-arms itself automatically whenever its due date changes — a recurring mark-done advance, or a future edit feature — with zero extra reset code); a `mark_reminders_notified(uuid[])` SQL function (PostgREST can't set a column to another column of the same row, only a literal); enables `pg_cron`/`pg_net`; schedules `send-reminder-digest-daily` at 12:00 UTC via `net.http_post`, authenticated with a bearer secret pulled from Supabase Vault by name (`cron_digest_invoke_secret`) — never committed as a literal.
- `web/supabase/functions/send-reminder-digest/index.ts` — Deno Edge Function. Auth-gates on a bespoke `CRON_INVOKE_SECRET` header check (not Supabase's default JWT verification, which would accept any logged-in user's session token — see `config.toml`'s `[functions.send-reminder-digest]` `verify_jwt = false`), queries reminders due within a 3-day window (a range, not strict equality, so one missed cron run can't permanently skip a reminder), groups by pet owner, resolves each owner's email via `auth.admin.getUserById` (no `profiles` table exists), sends one digest per owner via Resend, and marks that owner's reminders notified immediately after their own successful send (not batched) so a mid-run crash can't affect owners already processed.
- Email content is a Pawz-branded HTML card (teal/paper palette pulled straight from `globals.css`'s light-mode custom properties, table-based layout since that's the only markup shape that renders consistently across email clients like Outlook) plus a plain-text fallback in the same send — each reminder shown as "Pet Name / `<Type>`: `<label>` / Due: `<human date>` / Notes (only if present)". All user-entered text (label, notes, pet name) is HTML-escaped before interpolation. Zee may ask for further wording/styling passes later — flagged as expected, not a sign this is unfinished.
- `web/tsconfig.json` / `web/eslint.config.mjs` — both now exclude `supabase/functions/**`, since that's Deno code (`Deno.serve`, `npm:` specifiers) that would otherwise break `tsc`/`pnpm lint`.

**Verified as actually working (not just "files exist"):** migration applied live (`supabase migration list` shows 0003 local=remote); `cron.job` confirmed scheduled and active; function deployed and manually invoked directly (bypassing the cron wait) against real data. Beyond the initial pass, a full signoff checklist (12 of 14 named scenarios) was run against Zee's real account using temporary throwaway pets/reminders, each verified directly against the database rather than trusting response counts alone: due-today and due-in-3-days boundaries, due-in-5-days and overdue correctly excluded, a cancelled reminder excluded, an archived pet's reminder excluded, two reminders on one pet and two different pets both correctly bundled into a single email, idempotent re-invocation (no duplicate), re-arm on a due-date change, and 401 with zero DB side effects on a missing/wrong secret. Zee independently confirmed real delivery and content by checking her own inbox.

**Gotcha hit + fixed:** Resend's sandbox mode restricts delivery to the exact email the Resend account itself is registered under — initially that was `zahraa0503@gmail.com`, not `zahraalearns@gmail.com` (the address Zee actually logs into Pawz with), so a naive test looked broken. There is no "add a recipient" allowlist feature in Resend for this — the two real fixes are changing which email the Resend account uses, or verifying a custom domain. Zee changed her Resend account's email to `zahraalearns@gmail.com`, which resolved it for now; verifying a domain (once one exists) remains the permanent fix for delivering to *other* users' real addresses later.

**Gotcha hit + fixed (test design, not app code):** the first attempt at proving the cron fires completely unattended left one test reminder deliberately un-invoked — but then the manual-checklist `curl` command handed to Zee for her own testing swept it in anyway, since digests are grouped per-account, not per-reminder, so *any* invocation on that account processes everything currently due. Confirmed via `cron.job_run_details` (empty at the time) that this was not a real unattended fire. Fix: don't rely on a fragile "leave one alone" reminder at all — `cron.job_run_details` logs every attempt pg_cron itself makes, with or without anything to send, so checking that table directly is sufficient proof on its own.

**Follow-up bug found and fixed (2026-08-06):** the first-ever natural cron tick fired on schedule at 12:00 UTC and `cron.job_run_details` logged it as `succeeded` — but that only reflects `net.http_post`'s synchronous enqueue step, not the actual async HTTP call. Cross-checking `net._http_response` directly showed `timed_out: true`, with pg_net's default 5000ms timeout blown by a cold Edge Function boot (`npm:@supabase/supabase-js` resolving fresh) — even though that run had nothing to send. Since this function only runs once a day, it will realistically be cold on every production invocation, so this would have failed silently (looking "succeeded" in the one table anyone would normally check) every single day. Fixed via `0004_reminder_digest_timeout.sql`, using `cron.alter_job` to raise `timeout_milliseconds` to 30000. Verified live: manually re-invoked the same `net.http_post` call and got a real `200` (`eligibleReminders: 0, sent: 0, failed: 0`) in under 6s. Committed as `1211468`.

**Lesson for future cron/webhook work in this project:** don't trust `cron.job_run_details.status` alone to mean "the webhook succeeded" — for `net.http_post`-based jobs it only proves the request was queued. Check `net._http_response` (`status_code`, `timed_out`, `error_msg`) for the real outcome.

**Not done yet:** watching tomorrow's natural 12:00 UTC tick with the new timeout in place, just to see a fully unattended real-world run succeed end-to-end (optional at this point — the fix is verified, this would just be extra confidence). Deciding what to do with the still-uncommitted `SPEC.md` "9. Nice-to-Have Features" (PWA-manifest) section — left alone again, unrelated to this fix; worth Zee's attention whenever convenient.

---

## Phase F — Symptom log & vet report

**What:** SPEC reqs 20–23. Per the plan at `~/.claude/plans/linked-launching-origami.md`: symptom entries (description, date/time, severity, optional photo) and a printable vet-visit report (weight trend + symptoms + care events, filtered by date range), both confirmed with Zee to live under the pet profile's **Actions** tab as accordion cards — per the mockup's original "Actions expand in place, not separate screens" design — replacing `ActionsStub.tsx`.

- `web/supabase/migrations/0005_symptoms.sql` — `symptom_entries` table (`occurred_at timestamptz`, not just a date — spec asks for date *and* time; `severity` text+check like other category columns), owner-via-`pets`-join RLS matching `care_events`' pattern (select/insert/delete, no update — same immutable-log convention). Also creates a new, deliberately **reusable** private Storage bucket `pet-attachments` (path convention `{petId}/{category}/{id}.{ext}`, `category: "symptoms"` now) with matching `storage.objects` RLS — the first use of Supabase Storage in this repo; the Documents phase should reuse this bucket/convention unchanged, only widening the MIME allowlist.
- `web/src/lib/symptoms/{types,queries,actions,format}.ts` — mirrors `lib/reminders/` structure. `createSymptomEntry` does explicit pet-ownership check → validate photo (size/MIME, server-side) → upload → insert → **best-effort remove the uploaded photo if the insert fails**, so a failed submit can't leave an orphaned Storage object.
- `web/src/lib/storage/attachments.ts` — new, genuinely reusable module: bucket name/limits, `buildAttachmentPath`, `uploadAttachment`/`removeAttachments`/`getSignedAttachmentUrls`.
- `web/src/lib/report/{queries,format}.ts` — read-only report aggregation (not a full four-file module — no mutations). `summarizeWeightTrend` and friends are explicitly commented as deterministic-only, per spec req 23 (no AI-generated interpretation), so nobody "enhances" this file with a summarization call later.
- New components: `SymptomForm`/`SymptomModal`/`SymptomRow`/`SymptomPanel` (mirrors the `Reminder*` family), `VetReportPanel`/`ReportRangeSelect`/`PrintReportButton`. The Vet Report renders **inline** in its own Actions accordion (not a dedicated route) — a `?range=` query param on the existing pet-profile route, updated via client-side `router.push`, so the Actions tab selection and both accordions' open/closed state survive a range change. Print export reuses the mockup's already-designed `window.print()` + `@media print` approach (no PDF library); a body class (`printing-vet-report`) scopes printing to just the Vet Report card since other Actions accordions can be open at the same time.

**Three real bugs found and fixed during QA (not just the intended feature):**
1. **Every Storage RLS check silently failed, for everyone, always.** The policy's `exists (select 1 from pets where pets.id::text = (storage.foldername(name))[1] ...)` used a bare `name` — Postgres resolved it to `pets.name` (shadowed by the correlated subquery's own `pets` table, which also has a `name` column) instead of `storage.objects.name`. `storage.foldername('Max')` obviously never matches a pet id. Looked exactly like a client-auth propagation bug at first (and a real, separate one of those was chased and partially "fixed" — see below — before the actual root cause surfaced via a debug RPC comparing `auth.uid()` over PostgREST vs. a raw Storage API call with the identical token). Fixed in `0006_fix_pet_attachments_rls.sql` by qualifying the column explicitly.
2. **Two separate, stacked Next.js body-size limits, both well under the app's 10MB photo limit.** Server Actions default to 1MB (`experimental.serverActions.bodySizeLimit`); *separately*, `proxy.ts` (renamed from `middleware.ts` in this Next.js version) has its own ~10MB default cap on top of that (`experimental.proxyClientMaxBodySize`, formerly `middlewareClientMaxBodySize`). Both silently truncated/rejected real uploads before ever reaching the app's own clean "must be under 10MB" validation — the second one is especially nasty, surfacing as a raw "Unexpected end of form" crash rather than a clean error. Both raised in `next.config.ts` with headroom above 10MB.
3. **Real (harmless) bug:** `ReportRangeSelect`'s `<select>` was missing the `id` its `<label htmlFor="report-range">` pointed to.
4. Also worth noting: `@supabase/supabase-js`'s `.storage` sub-client is built once with a static headers snapshot at construction time (unlike `.from()`, which re-resolves the access token per request) — a real gap for any `@supabase/ssr` server client, genuinely unrelated to bug #1 above but easy to conflate with it. `lib/storage/attachments.ts`'s `getAuthedStorage` works around it by building a one-off client pinned to the resolved session token for every Storage call. Kept even after finding the *real* bug (#1), since it's independently correct and necessary — verified directly, not just assumed.

**Verified as actually working:** `tsc --noEmit`, `pnpm lint`, `pnpm test` (79 tests including new `symptoms/actions.test.ts` mocking the upload→insert→cleanup-on-failure ordering) all clean. Migrations 0005/0006 applied live and confirmed via direct SQL (table, indexes, RLS policies, bucket config, `storage.objects` policies all present as expected). A scripted Playwright pass against two throwaway accounts (one pet each) covered: every severity with/without a photo (real JPEG/PNG upload + signed-URL round-trip), disallowed MIME type and oversized-file rejection, empty-description and future-datetime rejection, newest-first ordering, cross-account/cross-pet isolation at both the DB and Storage layers (a second account can't read symptom rows, upload into, or get a signed URL for the first account's pet path), date-range boundary inclusivity (exactly-30-days-ago included, 31 excluded), accordion/tab state preserved across a range change, print-scoping (only the Vet Report card visible under `@media print`), and an empty-period graceful state. All 27 scenarios passed; test accounts, data, Storage objects, and the temporary `playwright` devDependency were all removed afterward.

**Not done yet:** Zee's own manual browser walkthrough (including a real phone photo upload — HEIC previews reliably only in Safari, flagged as an acceptable MVP caveat, not blocking); pushing the commit (see "Next up" — held back pending the parallel-session situation); reconciling with whatever the other active session's `WeightModal` refactor turns into.

---

## Next up

1. **Push Phase F** (commit `35e69e8`, local only) — held back rather than auto-pushed, since another active session's uncommitted UI refactor (`WeightModal`/`WeightForm`/`WeightPanel`/`ReminderPanel`/`ReminderModal`, plus `HAIRBALL_LOG.md`) is sitting in the same working tree. Worth confirming that session is done (or coordinating) before pushing, so nobody's work gets tangled or silently overwritten.
2. Decide what to do with the stray uncommitted `SPEC.md` PWA section (still unrelated, still sitting in the working tree since Phase E2).
3. Whatever's next per SPEC's build order after symptom log/vet report: documents, then Care Card.
