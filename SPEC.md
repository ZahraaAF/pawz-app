# Pawz — Product Spec (working codename: "Pawz")

*Compiled from a product workshop conversation. This is a living document — sections marked "Open" were deliberately deferred until they matter, not forgotten.*

---

## Status at a glance

| # | Section | Status |
|---|---|---|
| 1 | Vision Statement | ✅ Done |
| 2 | Mission Statement | ✅ Done |
| 3 | Target Audience | ✅ Done |
| 4 | User Personas | ✅ Done |
| 5 | Core Problems | ✅ Done |
| 6 | Unique Value Proposition | ✅ Done |
| 7 | Competitive Analysis | ✅ Done |
| 8 | Must-Have Features | ✅ Done |
| 9 | Nice-to-Have Features | ⏳ Open — revisit once building |
| 10 | Features That Should Wait Until After MVP | ⏳ Open (see "Deferred ideas" below — informally decided) |
| 11 | User Stories | ⏳ Open |
| 12 | User Flows | ⏳ Open — the HTML mockup substitutes for this for now |
| 13 | Functional Requirements | ✅ Done |
| 14 | Non-Functional Requirements | ⏳ Open — GDPR/privacy standard already committed to in Section 3 |
| 15 | Risks | ⏳ Open |
| 16 | Monetisation Ideas | ⏳ Open |
| 17 | Success Metrics | ⏳ Open |
| 18 | Product Roadmap | ⏳ Open |

Plan: finish the remaining sections opportunistically, mid-build, whenever something we hit makes one suddenly relevant — not as upfront paperwork.

---

## 1. Vision Statement

> *To be the one place pet parents can always rely on for their pet's care.*

## 2. Mission Statement

> *We help pet parents stay on top of their pet's health by giving them a reliable way to record, remember, and act on every vaccine, medication, and check-up — so nothing important is ever missed.*

## 3. Target Audience

- **Product scope is country-agnostic at MVP level.** The core problem — *"I don't want to forget my dog's vaccination again"* — has no geographic dependency.
- **Build standard:** developed in Ireland, built to GDPR / high-privacy standard by default (the strictest reasonable bar), English language, ISO-style date handling under the hood with locale-aware display. Means the product travels cleanly to any market later without rework.
- **Validation strategy:** opportunistic, not geo-gated. Users from Dublin, Mumbai, rescue groups — wherever real usage and honest feedback come fastest. Location is a go-to-market variable, not a scope constraint.
- **Primary audience:** pet parents (dogs & cats for v1), weighted toward multi-pet households and rescue/foster parents.
- **Phase 2 market:** India — larger, faster-growing, personally meaningful to the founder, deliberately sequenced after initial validation.
- **Explicitly out of scope:** vets/clinics as direct users (different B2B product), breeders/shelters as institutional bulk accounts (different data model), farm animals/livestock.

## 4. User Personas

### Pam — the Multi-Pet Household Manager
- 2 dogs + 1 cat, each on different vaccine/deworming/flea schedules.
- Currently juggles a phone calendar + notes app, manually re-entering dates after every vet visit.
- Wants one place showing "what's due, for which pet, when" — **and** a health **timeline**: a chronological view of what already happened (this week / two weeks ago / last month), not just what's upcoming.
- *"I have three vaccination cards in a drawer somewhere and I never remember which one needs updating — and I can never remember what we actually did last month either."*

### Aoife — the Rescue/Foster Parent
- Adopts/fosters rescue animals, often with **no known birth date, no prior vaccination history, unknown pre-existing conditions**, and no established feeding schedule for young rescues.
- Wants to build a reliable record starting from "unknown" and filling it in as information becomes available (e.g. after the first vet consultation).
- *"I didn't even know when he was born, let alone what shots he'd already had — after the first vet visit I just wanted somewhere to put everything we now knew, and keep adding to it."*

*(Grounded directly in the founder's own experience rescuing stray cats.)*

## 5. Core Problems This Product Solves

1. **Care events get forgotten**, with real consequences — the universal hook.
2. **No single source of truth**, especially with multiple pets — scattered across paper cards, notes apps, calendars.
3. **Rescue/foster animals start with an incomplete record**, and most tools assume a clean-slate puppy/kitten.
4. **Care history is invisible** — most tools are forward-only (next due date); no easy way to see what already happened.
5. **Updating records after a vet visit is manual and tedious** — friction at exactly the moment record-keeping matters most.
6. **Physical/digital proof has no home tied to the pet** — vaccination certs, blood test PDFs, vet reports live scattered in email/photos, disconnected from the record.

## 6. Unique Value Proposition

> **UVP:** *[App Name] is the reliable home for your pet's health — one place to track every profile, vaccine, and reminder, built for real pet life, not just clean-slate puppies.*

**Supporting pillars:**
1. **Never miss what matters** — multi-pet profiles with reminders for vaccines, meds, grooming, deworming, flea treatment, and vet visits, all in one place.
2. **Builds from "unknown"** — the only record that starts wherever you are, not wherever a breeder's paperwork started. *(Strongest, most durable edge — confirmed after competitive analysis.)*
3. **Emergency/sitter handoff** — curated care info ready to share in seconds, not a full record dump.
4. **Vet-visit-ready summaries** — a compiled, focused report is the differentiator, not the underlying symptom logging itself (see Competitive Analysis — logging alone is not unique).

## 7. Competitive Analysis — findings

**Direct competitors (personal health record + reminders):**
- **11pets** — the strongest, most mature competitor. Full medical records (x-rays, bloodwork), vaccination/deworming auto-schedules, medication reminders, weight/vitals tracking, hygiene reminders, nutrition logging, share-with-vet. **Already covers document storage and something close to symptom logging** ("medical incidents with photos and notes") — so those are *not* clean differentiators against it. No symptom-tracking-for-vet-visit workflow, no emergency/sitter handoff, no explicit rescue/unknown-history framing.
- **PawPrints – Pet Care Manager** — similar scope, newer, lower visible traction.
- **Petfolio / Petsfolio / Pawfolio (all variants)** — low traction across the board.

**Adjacent, different business model (not direct MVP rivals):**
- **PetDesk** — clinic-embedded software, not a standalone download; different distribution model entirely.
- **Vetic (India)** — vet booking + grooming + video consult + pharmacy delivery. This is the "vet marketplace" model already deliberately ruled out of MVP.
- **Supertails (India)** — e-commerce/pet store + clinic operator, not a personal record app.
- **PawPrint AI** — heavy AI positioning (AI vet chat, mood detection, breed ID) — the liability/cost profile already deliberately avoided.

**Conclusion:** the durable edge isn't a single unclaimed feature — most individual features get partially covered by *someone*. The real edge is: sharper focus (one thing done well vs. 11pets' broad scope), the rescue/unknown-history framing (unclaimed, and authentic to founder's own story), and the curated emergency/sitter card (distinct audience/content from "share full record with vet").

## 8. Must-Have Features (MVP)

| Feature | Why | MVP? |
|---|---|---|
| User authentication | Every other feature depends on a private, persistent account | Yes |
| Multiple pet profiles | Core structural unit of the product | Yes |
| Pet info fields (name, breed, age, sex, weight history, allergies, medications, vaccination history, medical history, notes) | The "reliable record" itself. **Every field except name/species must support blank/unknown without breaking the UI** — hard requirement for Aoife's use case | Yes |
| Reminder system (vaccines, meds, grooming, flea, worming, vet appts) | The universal hook. **Email-only for MVP** — push notifications add real infra/reliability complexity (service workers, poor iOS Safari support) for little MVP-stage benefit | Yes |
| Timeline / health history view | Pam's explicit need — same underlying data as reminders, just chronological | Yes |
| Symptom log + vet-visit report | Recall-bias problem. Log + list + **printable/exportable one-pager** filtered by date range. **No AI-generated interpretation** — deliberate scope guardrail | Yes |
| Document library | Physical/digital proof tied to the pet's record | Yes (table stakes vs. 11pets, not a differentiator) |
| Emergency / Care Card | Curated, safety-critical summary for a sitter/family member. **Export/print only in MVP — no live shareable link** (deliberate access-control guardrail; live sharing is a considered fast-follow) | Yes |

## 13. Functional Requirements

**Authentication & Accounts**
1. Create account (email + password), log in/out, reset password via email.
2. Data is private per account — no cross-user visibility.
3. Account deletion removes all associated pet data (GDPR right to erasure).

**Pet Profiles**
4. Multiple pet profiles per account.
5. Fields: name (required), species (required — dog/cat v1), breed, DOB *or* estimated age, sex, allergies, notes (all else optional).
6. **Any field except name/species can be blank without breaking the UI.**
7. Edit/archive a pet profile.
8. Switching active pet carries through Profile and Care Card views.

**Weight Tracking**
9. Log weight entries (value, unit, date).
10. Most recent entry = current weight.
11. View past entries chronologically.

**Care Events** (vaccinations, medications, deworming, flea, grooming, vet visits)
12. Log with type, date, optional notes.
13. Can be marked recurring (drives reminders).
14. Vaccination entries support "unknown/unconfirmed" as distinct from "not yet done."

**Reminders**
15. Generated from recurring care events (last date + interval).
16. Grouped into **Overdue** and **Upcoming**, color-coded per pet.
17. Email reminder N days before due (default 3) — **email only for MVP**.
18. Marking "done" logs a new event and recalculates next due date.
19. One-off reminders not tied to a recurring pattern are supported.

**Symptom Log & Vet Report**
20. Symptom entry: description, date/time, severity (mild/moderate/severe), optional photo.
21. Chronological listing per pet.
22. Generate printable/exportable report filtered by date range (weight trend + symptoms + care events).
23. **No AI-generated interpretation** in the report.

**Timeline**
24. Unified chronological feed per pet — weight, care events, symptoms, notes — tagged by type.

**Documents**
25. Upload file (PDF/JPG/PNG), attach to a pet, optionally link to a specific record entry.
26. View/download/delete.
27. File size/type restricted server-side — **default 10MB/file unless changed**.

**Emergency / Care Card**
28. Read-only summary: allergies, current meds, emergency vet contact, feeding notes, behavioral notes, emergency human contact.
29. Export/print as PDF.
30. **Not accessible via public/unauthenticated link in MVP.**

**Dashboard (Home)**
31. All pets shown as selectable tiles (compact status: weight + one status pill).
32. Combined Overdue and Upcoming lists across all pets, color-coded per pet — **deliberately not filtered by "active" pet**, since the whole point of the dashboard is cross-pet visibility (see Section 5, problem #2).
33. "Recently logged" activity feed across all pets.

---

## Deferred ideas (informally agreed, not yet formally written up as Section 10)

Explicitly **out of MVP**, for stated reasons — revisit post-launch:
- **Community features** (lost/found, adoption, rescue requests) — a different product with different dynamics (moderation, geolocation, two-sided posting). Good second-act idea, not now.
- **AI assistance** — cost, hallucination/liability risk in a health-adjacent product. If ever built, scope tightly (e.g. "summarize history for a vet," never diagnosis).
- **Vet appointment booking** — same chicken-and-egg supply-side problem as a vet directory; needs vets on board before it has value.
- **Live shareable Care Card link** — real access-control/privacy design needed first (GDPR-relevant); export/print covers MVP need.
- **Family/household sharing** — real value (multiple caregivers), real complexity (permissions/invites). Candidate for v1.1, not v1.
- **QR code shareable pet profile** — cheap to build, doubles as a growth/acquisition channel (scan on a collar → discover the app). Worth an earlier fast-follow, not core MVP.
- **Other species (rabbits, birds, reptiles, small mammals)** — clean post-MVP expansion once dogs/cats are solid.
- **Multiple reminder touchpoints per due date** (e.g. an email 3 days before *and* 1 day before, not just one fixed offset) — natural extension of the Phase E2 digest, and a plausible premium-tier lever (free = one fixed reminder, premium = pick your own schedule). Needs tracking which specific offsets have already fired per due date (not just one dedup value), so it's a real if modest schema change, not a copy-paste of the existing logic.

## Naming — status

**Not resolved yet.** Checked and ruled out due to existing collisions: Petfolio, Pawz, DigiPaws, DigiPawz, Digipawzee (all already used by existing pet apps, several closely matching this exact feature set). **"Pawz" is being used purely as an internal codename** for the mockup and this document — cheap to rename later (find-and-replace), not indicative of a final decision. A proper naming pass (trademark + domain + app-store search) is intentionally deferred to its own session, not done mid-build.

## Tech stack decision

- **Frontend:** Next.js (React)
- **Backend/DB/Auth/Storage:** Supabase (hosted Postgres, Auth, Storage) — avoids running infra locally, generous free tier
- **Hosting:** Vercel
- **Reminders:** Supabase Edge Functions on a cron schedule + Resend for email
- **Local dev:** Node + pnpm + Claude Code, no Docker needed for MVP
- Deliberately avoided: Kubernetes/microservices, a separate mobile framework, custom backend framework — unjustified weight for a solo-founder MVP.

## Design direction (from the HTML mockup)

- **Accent color:** teal (`--teal` / `--teal-strong` custom properties)
- **Pet identity colors:** Max (dog) = teal, matching primary accent; Luna (cat, rescue) = dusty plum — deliberately distinct from all semantic status colors (amber = due soon, brick = overdue, sage = good/complete)
- **Typography:** Times New Roman for headings/display, system sans-serif for body text (serif-at-small-sizes hurts scannability in a dense dashboard UI)
- **Navigation:** top tab bar (Home / Profile / Care Card) — no sidebar, no hamburger drawer (an earlier off-canvas drawer approach was tried and dropped — a `position: sticky` element left in the page flow while translated off-screen was silently reserving a full screen-height blank space; the fix was removing that entire approach, not patching it)
- **Profile page structure:** Overview / Timeline / Actions as one three-way toggle (not five flat tabs) — Actions (Symptoms, Documents, Vet report) expand in place as accordion cards rather than opening separate screens, deliberately chosen over sub-navigation because multiple windows/screens are more disorienting on mobile
- **Pet switching:** avatar-chip switcher (not a dropdown) — matches the app's avatar-driven visual language; revisit as a dropdown only if pet counts grow well beyond a handful
- **Dashboard reminders:** intentionally **not** filtered by "active" pet — combined Overdue/Upcoming across all pets is the whole point of a multi-pet dashboard (ties directly to Core Problem #2)

## Live mockup

Clickable HTML/CSS/JS prototype (no backend, static data for "Max" and "Luna"): **https://claude.ai/code/artifact/c96c62fa-353c-42b7-b397-9dc7048f8b86**

A copy of the mockup file as of this session also lives alongside this document at `pawz-mvp-mockup.html`.

## Next steps (as of this document)

1. Scaffold the real Next.js + Supabase project.
2. Build the Postgres schema from Section 13.
3. Port the mockup's HTML/CSS into real React components (not throwaway work — it's the visual foundation).
4. Build order: auth → pet CRUD → reminders → symptom log/report export → documents → Care Card.
5. Deploy to Vercel early and often, even before feature-complete.
6. Finish remaining spec sections (9–12, 14–18) opportunistically as they become relevant during the build.
