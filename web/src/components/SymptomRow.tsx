import { formatSymptomRelativeDate } from "@/lib/symptoms/format";
import type { SymptomEntry } from "@/lib/symptoms/types";

export default function SymptomRow({
  symptom,
  photoUrl,
}: {
  symptom: SymptomEntry;
  photoUrl?: string;
}) {
  return (
    <div className="card symptom-row">
      <div className="left">
        <span className={`sev sev-${symptom.severity}`} title={symptom.severity} />
        <div>
          <div className="t-title">{symptom.description}</div>
        </div>
        {photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- short-lived signed Storage URL, not eligible for next/image
          <img src={photoUrl} alt="" className="symptom-thumb" />
        )}
      </div>
      <div className="t-date mono">{formatSymptomRelativeDate(symptom.occurred_at)}</div>
    </div>
  );
}
