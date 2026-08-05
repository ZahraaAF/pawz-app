import { createReminder } from "@/lib/reminders/actions";
import ReminderRow from "@/components/ReminderRow";
import ReminderModal from "@/components/ReminderModal";
import type { ReminderSchedule } from "@/lib/reminders/types";

export default function ReminderPanel({
  pet,
  reminders,
}: {
  pet: { id: string; name: string };
  reminders: ReminderSchedule[];
}) {
  const boundCreateReminder = createReminder.bind(null, pet.id);

  return (
    <div className="weight-chart-wrap">
      <div className="weight-chart-head">
        <div
          style={{
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "var(--ink-faint)",
          }}
        >
          Reminders
        </div>
      </div>
      {reminders.length === 0 ? (
        <div className="empty-state">No reminders set for {pet.name} yet.</div>
      ) : (
        <div className="reminder-list" style={{ marginBottom: 14 }}>
          {reminders.map((r) => (
            <ReminderRow key={r.id} schedule={r} pet={pet} />
          ))}
        </div>
      )}
      <ReminderModal action={boundCreateReminder} />
    </div>
  );
}
