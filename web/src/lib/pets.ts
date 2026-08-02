export type PillTone = "overdue" | "soon" | "ok" | "unknown";

export type Pet = {
  id: string;
  name: string;
  species: "Dog" | "Cat";
  breed: string;
  ageLabel: string;
  ageShortLabel: string;
  sex: string;
  weightKg: number;
  colorVar: "--pet-max" | "--pet-luna";
  initial: string;
  statusPill: { label: string; tone: PillTone };
};

export type Reminder = {
  id: string;
  petId: string;
  title: string;
  meta: string;
  dueLabel: string;
  tone: PillTone;
  group: "overdue" | "upcoming";
};

export type RecentEvent = {
  id: string;
  petId: string;
  title: string;
  meta: string;
};

export const pets: Pet[] = [
  {
    id: "max",
    name: "Max",
    species: "Dog",
    breed: "Golden Retriever",
    ageLabel: "4 years old",
    ageShortLabel: "4y",
    sex: "Male, neutered",
    weightKg: 29.5,
    colorVar: "--pet-max",
    initial: "M",
    statusPill: { label: "Up to date", tone: "ok" },
  },
  {
    id: "luna",
    name: "Luna",
    species: "Cat",
    breed: "Domestic Shorthair",
    ageLabel: "~2 years (vet estimate)",
    ageShortLabel: "~2y",
    sex: "Female, spayed",
    weightKg: 3.8,
    colorVar: "--pet-luna",
    initial: "L",
    statusPill: { label: "1 overdue", tone: "overdue" },
  },
];

export const reminders: Reminder[] = [
  {
    id: "r1",
    petId: "luna",
    title: "Weight re-check",
    meta: "Luna · follow-up from intake exam",
    dueLabel: "2 days overdue",
    tone: "overdue",
    group: "overdue",
  },
  {
    id: "r2",
    petId: "max",
    title: "Flea & heartworm chewable",
    meta: "Max · monthly",
    dueLabel: "Due in 3d",
    tone: "soon",
    group: "upcoming",
  },
  {
    id: "r3",
    petId: "luna",
    title: "Rabies vaccine (1st dose)",
    meta: "Luna · booked at Rathmines Vet Clinic",
    dueLabel: "Due in 5d",
    tone: "soon",
    group: "upcoming",
  },
  {
    id: "r4",
    petId: "max",
    title: "Annual check-up",
    meta: "Max · routine wellness exam",
    dueLabel: "In 3 weeks",
    tone: "ok",
    group: "upcoming",
  },
];

export const recentEvents: RecentEvent[] = [
  {
    id: "e1",
    petId: "luna",
    title: "Symptom noted — mild sneezing, watery left eye",
    meta: "Luna · 3 days ago",
  },
  {
    id: "e2",
    petId: "max",
    title: "Weight logged — 29.5 kg",
    meta: "Max · today",
  },
];

export function getPet(id: string): Pet | undefined {
  return pets.find((p) => p.id === id);
}
