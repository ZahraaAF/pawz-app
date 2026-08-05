import { petAccentStyle } from "@/lib/pets/color";
import { formatDueLabel } from "@/lib/reminders/format";
import { markReminderDone, cancelReminder } from "@/lib/reminders/actions";
import type { ReminderSchedule } from "@/lib/reminders/types";

export default function ReminderRow({
  schedule,
  pet,
}: {
  schedule: ReminderSchedule;
  pet: { id: string; name: string };
}) {
  const due = formatDueLabel(schedule.next_due_on);
  const pillClass =
    due.tone === "overdue" ? "pill-overdue" : due.tone === "soon" ? "pill-soon" : "pill-ok";
  const boundMarkDone = markReminderDone.bind(null, schedule.id);
  const boundCancel = cancelReminder.bind(null, schedule.id);

  return (
    <div
      className="reminder-row pet-accent-scope"
      style={{ ...petAccentStyle(pet.id), borderLeftColor: "var(--pet-accent)" }}
    >
      <span className="r-pet-dot" style={{ background: "var(--pet-accent)" }}>
        {pet.name.charAt(0).toUpperCase()}
      </span>
      <span>
        <span className="r-title">{schedule.label}</span>
        <span className="r-meta">
          {pet.name} · {schedule.is_recurring ? "recurring" : "one-off"}
        </span>
      </span>
      <span className="r-due">
        <span className={`pill ${pillClass}`}>{due.text}</span>
      </span>
      <div className="r-actions">
        <form action={boundMarkDone}>
          <button className="r-action" type="submit">
            Mark done
          </button>
        </form>
        <form action={boundCancel}>
          <button className="r-action-cancel" type="submit">
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}
