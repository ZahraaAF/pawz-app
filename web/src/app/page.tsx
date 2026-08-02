import { pets, reminders, recentEvents } from "@/lib/pets";
import PetTiles from "@/components/PetTiles";
import ReminderList from "@/components/ReminderList";
import RecentEventList from "@/components/RecentEventList";

export default function Home() {
  const petsById = new Map(pets.map((pet) => [pet.id, pet]));
  const overdue = reminders.filter((r) => r.group === "overdue");
  const upcoming = reminders.filter((r) => r.group === "upcoming");

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Good morning.</h1>
          <div className="lede">Here&apos;s what&apos;s coming up across both your pets.</div>
        </div>
      </div>

      <PetTiles pets={pets} />

      {overdue.length > 0 && (
        <section className="block">
          <h2 style={{ color: "var(--brick)" }}>Overdue</h2>
          <ReminderList reminders={overdue} petsById={petsById} tone="tone-overdue" />
        </section>
      )}

      {upcoming.length > 0 && (
        <section className="block">
          <h2 style={{ color: "var(--marigold)" }}>Upcoming</h2>
          <ReminderList reminders={upcoming} petsById={petsById} tone="tone-upcoming" />
        </section>
      )}

      {recentEvents.length > 0 && (
        <section className="block">
          <h2>Recently logged</h2>
          <RecentEventList events={recentEvents} petsById={petsById} />
        </section>
      )}
    </div>
  );
}
