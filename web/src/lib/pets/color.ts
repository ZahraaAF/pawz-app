import type { CSSProperties } from "react";

// Blue/purple/teal spectrum only — deliberately avoids green (sage),
// amber (marigold), and red (brick), which are already reserved for
// status pills in globals.css.
const PET_ACCENT_PALETTE: { light: string; dark: string }[] = [
  { light: "#1c6b6b", dark: "#4fa8a8" }, // teal
  { light: "#7d4863", dark: "#c084a8" }, // plum
  { light: "#4a5b8c", dark: "#8b9bd4" }, // indigo
  { light: "#2f6690", dark: "#6bb0d9" }, // cobalt
  { light: "#8c5a7d", dark: "#cc9bc0" }, // mauve
  { light: "#6b4c8c", dark: "#ab8ad4" }, // violet
  { light: "#4c5e73", dark: "#8fa3b8" }, // slate
  { light: "#8c4c5e", dark: "#d49bab" }, // rose
];

function hashPetId(petId: string): number {
  let hash = 0;
  for (let i = 0; i < petId.length; i++) {
    hash = (hash * 31 + petId.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function getPetAccentColor(petId: string): { light: string; dark: string } {
  return PET_ACCENT_PALETTE[hashPetId(petId) % PET_ACCENT_PALETTE.length];
}

// Spread onto any element's className="pet-accent-scope" + style to make
// var(--pet-accent) resolve to this pet's color, light/dark aware.
export function petAccentStyle(petId: string): CSSProperties {
  const { light, dark } = getPetAccentColor(petId);
  return {
    "--pet-accent-light": light,
    "--pet-accent-dark": dark,
  } as CSSProperties;
}
