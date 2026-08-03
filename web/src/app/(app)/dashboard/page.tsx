import Link from "next/link";
import { requireUser } from "@/lib/auth/dal";
import { getPetsForUser } from "@/lib/pets/queries";
import PetTile from "@/components/PetTile";

export default async function DashboardPage() {
  await requireUser();
  const pets = await getPetsForUser();

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
          <PetTile key={pet.id} pet={pet} />
        ))}
        <Link href="/pets/new" className="card add-pet-tile">
          + Add a pet
        </Link>
      </div>

      <section className="block">
        <h2 style={{ color: "var(--brick)" }}>Overdue</h2>
        <div className="card">
          <div className="empty-state">
            Nothing overdue — reminders arrive in a later update.
          </div>
        </div>
      </section>

      <section className="block">
        <h2 style={{ color: "var(--marigold)" }}>Upcoming</h2>
        <div className="card">
          <div className="empty-state">
            Nothing due yet — reminders arrive in a later update.
          </div>
        </div>
      </section>

      <section className="block">
        <h2>Recently logged</h2>
        <div className="card">
          <div className="empty-state">No activity logged yet.</div>
        </div>
      </section>
    </>
  );
}
