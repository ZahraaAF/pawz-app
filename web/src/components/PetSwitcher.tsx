import Link from "next/link";
import { petAccentStyle } from "@/lib/pets/color";
import type { PetWithCurrentWeight } from "@/lib/pets/types";

export default function PetSwitcher({
  pets,
  currentPetId,
}: {
  pets: PetWithCurrentWeight[];
  currentPetId: string;
}) {
  if (pets.length <= 1) return null;

  return (
    <div className="profile-switch-bar">
      <div className="chip-row" role="group" aria-label="Switch pet">
        <span className="chip-hint">Switch</span>
        {pets.map((pet) => (
          <Link
            key={pet.id}
            href={`/pets/${pet.id}`}
            className="chip-avatar pet-accent-scope"
            style={{ ...petAccentStyle(pet.id), background: "var(--pet-accent)" }}
            aria-current={pet.id === currentPetId ? "true" : "false"}
          >
            {pet.name.charAt(0).toUpperCase()}
          </Link>
        ))}
      </div>
    </div>
  );
}
