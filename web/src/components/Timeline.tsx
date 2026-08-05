import { petAccentStyle } from "@/lib/pets/color";
import { formatRelativeDate } from "@/lib/reminders/format";
import { CARE_EVENT_TYPES } from "@/lib/reminders/types";
import { logCareEvent } from "@/lib/reminders/actions";
import LogEventModal from "@/components/LogEventModal";
import type { CareEvent } from "@/lib/reminders/types";

function typeLabel(type: CareEvent["type"]): string {
  return CARE_EVENT_TYPES.find((t) => t.value === type)?.label ?? type;
}

export default function Timeline({
  pet,
  events,
}: {
  pet: { id: string; name: string };
  events: CareEvent[];
}) {
  const boundLogCareEvent = logCareEvent.bind(null, pet.id);

  return (
    <div>
      <LogEventModal action={boundLogCareEvent} />
      {events.length === 0 ? (
        <div className="card stub-panel">No history logged yet.</div>
      ) : (
        <div className="timeline pet-accent-scope" style={petAccentStyle(pet.id)}>
          {events.map((event) => (
            <div className="t-entry" key={event.id}>
              <span className="t-dot" />
              <div className="t-date mono">{formatRelativeDate(event.occurred_on)}</div>
              <div className="card t-card">
                <div className="t-title">{event.label}</div>
                {event.notes && <div className="t-note">{event.notes}</div>}
                <span className="t-tag pill pill-unknown">{typeLabel(event.type)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
