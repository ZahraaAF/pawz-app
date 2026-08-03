import Link from "next/link";
import { petAccentStyle } from "@/lib/pets/color";
import { formatAge, formatWeight } from "@/lib/pets/format";
import type { PetWithCurrentWeight } from "@/lib/pets/types";

export default function ProfileHeader({ pet }: { pet: PetWithCurrentWeight }) {
  return (
    <div className="profile-head pet-accent-scope" style={petAccentStyle(pet.id)}>
      <span className="profile-avatar" style={{ background: "var(--pet-accent)" }}>
        {pet.name.charAt(0).toUpperCase()}
      </span>
      <div style={{ flex: 1 }}>
        <h1>{pet.name}</h1>
        <div className="profile-facts">
          <span>
            <b>{pet.breed ?? "Breed unknown"}</b>
          </span>
          <span>
            {pet.sex ? (pet.sex === "male" ? "Male" : "Female") : "Sex unknown"}
            {pet.neutered == null
              ? ""
              : pet.neutered
                ? ", neutered"
                : ", not neutered"}
          </span>
          <span>{formatAge(pet)}</span>
          {pet.current_weight && (
            <span className="mono">{formatWeight(pet.current_weight)}</span>
          )}
        </div>
      </div>
      <Link href={`/pets/${pet.id}/edit`} className="btn secondary">
        Edit
      </Link>
    </div>
  );
}
