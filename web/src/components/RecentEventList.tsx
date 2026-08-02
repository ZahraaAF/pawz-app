import type { Pet, RecentEvent } from "@/lib/pets";

export default function RecentEventList({
  events,
  petsById,
}: {
  events: RecentEvent[];
  petsById: Map<string, Pet>;
}) {
  return (
    <div className="card reminder-list">
      {events.map((event) => {
        const pet = petsById.get(event.petId);
        return (
          <div
            key={event.id}
            className="reminder-row"
            style={{ borderLeftColor: pet ? `var(${pet.colorVar})` : undefined }}
          >
            <span className="r-pet-dot" style={{ background: pet ? `var(${pet.colorVar})` : undefined }}>
              {pet?.initial}
            </span>
            <span>
              <span className="r-title">{event.title}</span>
              <span className="r-meta">{event.meta}</span>
            </span>
            <span className="r-due"></span>
            <button className="r-action">View</button>
          </div>
        );
      })}
    </div>
  );
}
