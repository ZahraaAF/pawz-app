# Pawz — Project Notes

Living handoff doc: what's been built, why, and what's next. Updated at the end of each phase. For exact technical steps of the phase we're currently mid-way through, see the plan at `~/.claude/plans/hi-claude-inspect-the-wise-taco.md` — this file is the narrative companion, not a replacement.

Last updated: end of Phase E2. Phases D and E1 are committed and pushed. Phase E2 (reminder email digest) is built, deployed, and verified end-to-end against the live project, but **not committed yet** (see "Phase E2" below).

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
- `web/supabase/functions/send-reminder-digest/index.ts` — Deno Edge Function. Auth-gates on a bespoke `CRON_INVOKE_SECRET` header check (not Supabase's default JWT verification, which would accept any logged-in user's session token — see `config.toml`'s `[functions.send-reminder-digest]` `verify_jwt = false`), queries reminders due within a 3-day window (a range, not strict equality, so one missed cron run can't permanently skip a reminder), groups by pet owner, resolves each owner's email via `auth.admin.getUserById` (no `profiles` table exists), sends one plain-text digest per owner via Resend, and marks that owner's reminders notified immediately after their own successful send (not batched) so a mid-run crash can't affect owners already processed.
- `web/tsconfig.json` / `web/eslint.config.mjs` — both now exclude `supabase/functions/**`, since that's Deno code (`Deno.serve`, `npm:` specifiers) that would otherwise break `tsc`/`pnpm lint`.

**Verified as actually working (not just "files exist"):** migration applied live (`supabase migration list` shows 0003 local=remote); `cron.job` confirmed scheduled and active; function deployed and manually invoked directly (bypassing the cron wait) against real data — a throwaway pre-confirmed test account (email matching Zee's actual Resend-registered address, since Resend's sandbox mode only delivers to the exact account email — notably **not** the `zahraalearns@gmail.com` Zee logs into the app with) received a real digest email end-to-end; confirmed idempotent on immediate re-invocation (dedup column correctly excludes an already-notified reminder, no duplicate send); confirmed 401 on a missing/wrong secret with no DB side effects; confirmed a reminder re-arms and sends a fresh email when its due date changes after already being notified. All throwaway test data (account, pet, reminder) and debug scripts were deleted afterward.

**Known limitation, not a bug:** without a verified custom domain in Resend (blocked on app naming/domain still being unresolved), real delivery is restricted to Zee's own Resend-account email. Fine while she's the only real user — verifying a domain to unlock delivery to other users' real addresses is an explicit, deliberate follow-up whenever that's needed, not scoped into E2.

**Not done yet:** letting the real `cron.schedule` run unattended overnight to confirm it fires on its own (everything above was manual/direct invocation, which proves the function itself works correctly — the schedule mechanism is the one piece that hasn't had a real unattended run yet); committing this phase.

**Also noticed, unrelated to this phase:** `SPEC.md` has an uncommitted "9. Nice-to-Have Features" section (a PWA-manifest idea) sitting in the working tree from some earlier session — left alone/out of the Phase E2 commit since it's unrelated; worth Zee's attention whenever convenient.

---

## Next up

1. Let the Phase E2 cron job run unattended overnight; next morning, confirm an email arrived with no manual trigger and `last_notified_for_due_on` moved on its own.
2. Commit Phase E2 (and decide separately what to do with the stray uncommitted `SPEC.md` PWA section).
3. Whatever's next per SPEC's build order after reminders: symptom log/vet report, then documents, then Care Card.
