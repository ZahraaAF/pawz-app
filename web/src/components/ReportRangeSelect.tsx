"use client";

import { usePathname, useRouter } from "next/navigation";
import { REPORT_RANGE_PRESETS, type ReportRangePreset } from "@/lib/report/format";

export default function ReportRangeSelect({ value }: { value: ReportRangePreset }) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <select
      id="report-range"
      value={value}
      onChange={(e) => router.push(`${pathname}?range=${e.target.value}`)}
    >
      {REPORT_RANGE_PRESETS.map((p) => (
        <option key={p.value} value={p.value}>
          {p.label}
        </option>
      ))}
    </select>
  );
}
