# Pawz — Project Notes

Living handoff doc: what's been built, why, and what's next. Updated at the end of each phase. For exact technical steps of the phase we're currently mid-way through, see the plan at `~/.claude/plans/hi-claude-inspect-the-wise-taco.md` — this file is the narrative companion, not a replacement.

Last updated: end of Phase C, committed. Phase D (pet CRUD) has files on disk but is **not committed yet** — untested, held back deliberately (see "Next up" at the bottom).

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

## Next up — Phase D: Pet CRUD

Files already exist on disk (`web/supabase/migrations/0001_pets_and_weights.sql`, `web/src/lib/pets/*`) but are **not committed yet** — this slice hasn't been tested end-to-end, so it's deliberately held back rather than bundled into the Phase B/C commit.
