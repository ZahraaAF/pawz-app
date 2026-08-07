import { formatAge } from "@/lib/pets/format";
import { formatRelativeDate } from "@/lib/reminders/format";
import { formatSymptomRelativeDate } from "@/lib/symptoms/format";
import { REPORT_RANGE_PRESETS, summarizeWeightTrend, type ReportRangePreset } from "@/lib/report/format";
import type { VetReportData } from "@/lib/report/queries";
import type { PetWithCurrentWeight } from "@/lib/pets/types";
import ReportRangeSelect from "@/components/ReportRangeSelect";
import PrintReportButton from "@/components/PrintReportButton";

function sexLabel(pet: PetWithCurrentWeight): string {
  if (!pet.sex) return "Sex unknown";
  const base = pet.sex === "male" ? "Male" : "Female";
  if (pet.neutered == null) return base;
  return pet.neutered ? `${base}, neutered` : `${base}, not neutered`;
}

export default function VetReportPanel({
  pet,
  range,
  data,
}: {
  pet: PetWithCurrentWeight;
  range: ReportRangePreset;
  data: VetReportData;
}) {
  const rangeLabel = REPORT_RANGE_PRESETS.find((p) => p.value === range)?.label ?? "";
  const latestWeight = data.weights[0];

  return (
    <div>
      <div className="report-controls">
        <label htmlFor="report-range">Date range</label>
        <ReportRangeSelect value={range} />
        <PrintReportButton />
      </div>

      <div className="report-sheet-wrap">
        <div className="report-sheet">
          <h3>{pet.name} — Vet visit summary</h3>
          <div className="report-meta">
            {pet.breed ?? "Breed unknown"} · {sexLabel(pet)} · {formatAge(pet)} · Range: {rangeLabel}
          </div>

          <h4>Weight</h4>
          <div className="report-line">
            <span>{summarizeWeightTrend(data.weights)}</span>
            <span className="d mono">
              {latestWeight ? formatRelativeDate(latestWeight.logged_on) : ""}
            </span>
          </div>

          <h4>Symptoms logged</h4>
          {data.symptoms.length === 0 ? (
            <div className="report-line">
              <span>None logged in this period</span>
              <span className="d" />
            </div>
          ) : (
            data.symptoms.map((s) => (
              <div className="report-line" key={s.id}>
                <span>{s.description}</span>
                <span className="d mono">{formatSymptomRelativeDate(s.occurred_at)}</span>
              </div>
            ))
          )}

          <h4>Care events</h4>
          {data.careEvents.length === 0 ? (
            <div className="report-line">
              <span>None logged in this period</span>
              <span className="d" />
            </div>
          ) : (
            data.careEvents.map((e) => (
              <div className="report-line" key={e.id}>
                <span>{e.label}</span>
                <span className="d mono">{formatRelativeDate(e.occurred_on)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
