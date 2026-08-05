import Link from "next/link";
import { requireUser } from "@/lib/auth/dal";
import { getPetsForUser } from "@/lib/pets/queries";
import { getOverdueAndUpcomingReminders, getRecentCareEvents } from "@/lib/reminders/queries";
import { groupReminderCountsByPet, formatRelativeDate } from "@/lib/reminders/format";
import { petAccentStyle } from "@/lib/pets/color";
import PetTile from "@/components/PetTile";
import ReminderRow from "@/components/ReminderRow";

export default async function DashboardPage() {
  await requireUser();

  const [pets, { overdue, upcoming }, recentEvents] = await Promise.all([
    getPetsForUser(),
    getOverdueAndUpcomingReminders(),
    getRecentCareEvents(),
  ]);

  const reminderCountsByPet = groupReminderCountsByPet(overdue, upcoming);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Good day.</h1>
          <div className="lede">
            {pets.length === 0
              ? "Add your first pet to get started."
              : "Here's what's coming up across your pets."}
          </div>
        </div>
      </div>

      <div className="summary-grid">
        {pets.map((pet) => (
          <PetTile
            key={pet.id}
            pet={pet}
            reminderCounts={reminderCountsByPet.get(pet.id)}
          />
        ))}
        <Link href="/pets/new" className="card add-pet-tile">
          + Add a pet
        </Link>
      </div>

      <section className="block">
        <h2 style={{ color: "var(--brick)" }}>Overdue</h2>
        {overdue.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              Nothing overdue — you&apos;re all caught up.
            </div>
          </div>
        ) : (
          <div className="card reminder-list tone-overdue">
            {overdue.map((r) => (
              <ReminderRow key={r.id} schedule={r} pet={r.pets} />
            ))}
          </div>
        )}
      </section>

      <section className="block">
        <h2 style={{ color: "var(--marigold)" }}>Upcoming</h2>
        {upcoming.length === 0 ? (
          <div className="card">
            <div className="empty-state">Nothing due yet.</div>
          </div>
        ) : (
          <div className="card reminder-list tone-upcoming">
            {upcoming.map((r) => (
              <ReminderRow key={r.id} schedule={r} pet={r.pets} />
            ))}
          </div>
        )}
      </section>

      <section className="block">
        <h2>Recently logged</h2>
        {recentEvents.length === 0 ? (
          <div className="card">
            <div className="empty-state">No activity logged yet.</div>
          </div>
        ) : (
          <div className="card reminder-list">
            {recentEvents.map((event) => (
              <div
                key={event.id}
                className="reminder-row pet-accent-scope"
                style={{
                  ...petAccentStyle(event.pets.id),
                  borderLeftColor: "var(--pet-accent)",
                }}
              >
                <span className="r-pet-dot" style={{ background: "var(--pet-accent)" }}>
                  {event.pets.name.charAt(0).toUpperCase()}
                </span>
                <span>
                  <span className="r-title">{event.label}</span>
                  <span className="r-meta">{event.pets.name}</span>
                </span>
                <span className="r-due">{formatRelativeDate(event.occurred_on)}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
