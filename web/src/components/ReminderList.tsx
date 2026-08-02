import type { Pet, Reminder } from "@/lib/pets";

function ReminderRow({
  reminder,
  pet,
  actionLabel = "Mark done",
}: {
  reminder: Reminder;
  pet: Pet | undefined;
  actionLabel?: string;
}) {
  return (
    <div
      className="reminder-row"
      style={{ borderLeftColor: pet ? `var(${pet.colorVar})` : undefined }}
    >
      <span
        className="r-pet-dot"
        style={{ background: pet ? `var(${pet.colorVar})` : undefined }}
      >
        {pet?.initial}
      </span>
      <span>
        <span className="r-title">{reminder.title}</span>
        <span className="r-meta">{reminder.meta}</span>
      </span>
      <span className="r-due">
        <span className={`pill pill-${reminder.tone}`}>{reminder.dueLabel}</span>
      </span>
      <button className="r-action">{actionLabel}</button>
    </div>
  );
}

export default function ReminderList({
  reminders,
  petsById,
  tone,
}: {
  reminders: Reminder[];
  petsById: Map<string, Pet>;
  tone: "tone-overdue" | "tone-upcoming" | "";
}) {
  return (
    <div className={`card reminder-list ${tone}`}>
      {reminders.map((r) => (
        <ReminderRow key={r.id} reminder={r} pet={petsById.get(r.petId)} />
      ))}
    </div>
  );
}
