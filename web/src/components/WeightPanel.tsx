import { formatWeight } from "@/lib/pets/format";
import { addWeightEntry } from "@/lib/pets/actions";
import WeightForm from "@/components/WeightForm";
import WeightHistoryList from "@/components/WeightHistoryList";
import type { PetWithCurrentWeight, WeightEntry } from "@/lib/pets/types";

export default function WeightPanel({
  pet,
  history,
}: {
  pet: PetWithCurrentWeight;
  history: WeightEntry[];
}) {
  const boundAddWeightEntry = addWeightEntry.bind(null, pet.id);

  return (
    <div className="card weight-chart-wrap">
      <div className="weight-chart-head">
        <div>
          <div
            style={{
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "var(--ink-faint)",
            }}
          >
            Weight
          </div>
          <div className="current mono">
            {pet.current_weight ? formatWeight(pet.current_weight) : "No entries yet"}
          </div>
        </div>
        <span className="pill pill-unknown">
          {history.length} {history.length === 1 ? "log" : "logs"}
        </span>
      </div>
      <WeightForm action={boundAddWeightEntry} />
      <WeightHistoryList history={history} />
    </div>
  );
}
