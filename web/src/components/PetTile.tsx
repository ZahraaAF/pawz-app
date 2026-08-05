import Link from "next/link";
import { petAccentStyle } from "@/lib/pets/color";
import { formatAge, formatWeight } from "@/lib/pets/format";
import type { ReminderCounts } from "@/lib/reminders/format";
import { petStatusPill } from "@/lib/reminders/format";
import type { PetWithCurrentWeight } from "@/lib/pets/types";

export default function PetTile({
  pet,
  reminderCounts,
}: {
  pet: PetWithCurrentWeight;
  reminderCounts?: ReminderCounts;
}) {
  const status = petStatusPill(reminderCounts);
  const pillClass =
    status.tone === "overdue"
      ? "pill-overdue"
      : status.tone === "ok"
        ? "pill-ok"
        : "pill-unknown";

  return (
    <Link
      href={`/pets/${pet.id}`}
      className="card pet-tile pet-accent-scope"
      style={petAccentStyle(pet.id)}
    >
      <span className="tile-arrow">&#8250;</span>
      <span
        className="pet-avatar tile-avatar"
        style={{ background: "var(--pet-accent)" }}
      >
        {pet.name.charAt(0).toUpperCase()}
      </span>
      <span className="tile-name">{pet.name}</span>
      <span className="pet-sub">
        {pet.species === "dog" ? "Dog" : "Cat"} · {formatAge(pet)}
      </span>
      <span className="tile-weight mono">
        {pet.current_weight ? formatWeight(pet.current_weight) : "No weight logged"}
      </span>
      <span className={`pill ${pillClass}`}>{status.label}</span>
    </Link>
  );
}
