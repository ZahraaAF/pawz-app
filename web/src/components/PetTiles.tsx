import Link from "next/link";
import type { Pet } from "@/lib/pets";

export default function PetTiles({ pets }: { pets: Pet[] }) {
  return (
    <div className="summary-grid">
      {pets.map((pet) => (
        <Link key={pet.id} href={`/pets/${pet.id}`} className="card pet-tile">
          <span className="tile-arrow">&#8250;</span>
          <span
            className="pet-avatar"
            style={{
              background: `var(${pet.colorVar})`,
              width: 34,
              height: 34,
              fontSize: 14,
            }}
          >
            {pet.initial}
          </span>
          <span className="tile-name">{pet.name}</span>
          <span className="pet-sub">
            {pet.species} · {pet.ageShortLabel}
          </span>
          <span className="tile-weight mono">{pet.weightKg} kg</span>
          <span className={`pill pill-${pet.statusPill.tone}`}>{pet.statusPill.label}</span>
        </Link>
      ))}
    </div>
  );
}
