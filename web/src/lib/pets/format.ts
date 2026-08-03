function ageInYears(dobIso: string): number {
  const dob = new Date(dobIso);
  const now = new Date();
  let years = now.getFullYear() - dob.getFullYear();
  const hadBirthdayThisYear =
    now.getMonth() > dob.getMonth() ||
    (now.getMonth() === dob.getMonth() && now.getDate() >= dob.getDate());
  if (!hadBirthdayThisYear) years -= 1;
  return years;
}

function ageInMonths(dobIso: string): number {
  const dob = new Date(dobIso);
  const now = new Date();
  return (
    (now.getFullYear() - dob.getFullYear()) * 12 + (now.getMonth() - dob.getMonth())
  );
}

export function formatAge(pet: {
  dob: string | null;
  estimated_age_label: string | null;
}): string {
  if (pet.dob) {
    const years = ageInYears(pet.dob);
    if (years < 1) {
      const months = Math.max(ageInMonths(pet.dob), 0);
      return `${months} ${months === 1 ? "month" : "months"} old`;
    }
    return `${years} ${years === 1 ? "year" : "years"} old`;
  }
  if (pet.estimated_age_label) {
    return `~${pet.estimated_age_label} (estimate)`;
  }
  return "Age unknown";
}

export function formatWeight(entry: { value: number | string; unit: string }): string {
  const num = typeof entry.value === "string" ? parseFloat(entry.value) : entry.value;
  const rounded = Number(num.toFixed(2));
  return `${rounded} ${entry.unit}`;
}

export function fieldValue(
  value: string | null | undefined,
  unknownLabel = "Unknown",
): { text: string; unknown: boolean } {
  if (value == null || value.trim() === "") {
    return { text: unknownLabel, unknown: true };
  }
  return { text: value, unknown: false };
}
