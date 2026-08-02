# Pawz — Project Notes

Living handoff doc: what's been built, why, and what's next. Updated at the end of each phase. For exact technical steps of the phase we're currently mid-way through, see the plan at `~/.claude/plans/hi-claude-inspect-the-wise-taco.md` — this file is the narrative companion, not a replacement.

Last updated: 2026-08-02, end of Phase A.

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

## Next up — Phase B: Auth

Not started yet. Per the plan: `web/src/proxy.ts` (replaces `middleware.ts` — renamed in this Next.js version) for session refresh + route protection, a `getUser()` DAL helper that every Server Action independently calls (the proxy is a fast-path UX layer, not the sole guard), login/signup/forgot-password/reset-password pages under `(auth)/`, the `/auth/callback` route for email confirmation links, and logout as a plain form action. Ends with `page.tsx` becoming an auth-aware redirect to `/dashboard` or `/login`.
