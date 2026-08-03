import { formatWeight } from "@/lib/pets/format";
import type { WeightEntry } from "@/lib/pets/types";

export default function WeightHistoryList({ history }: { history: WeightEntry[] }) {
  if (history.length === 0) {
    return <div className="empty-state">No weight logged yet.</div>;
  }

  return (
    <div>
      {history.map((entry) => (
        <div key={entry.id} className="weight-row">
          <span>{formatWeight(entry)}</span>
          <span className="mono" style={{ color: "var(--ink-faint)" }}>
            {new Date(entry.logged_on).toLocaleDateString()}
          </span>
        </div>
      ))}
    </div>
  );
}
