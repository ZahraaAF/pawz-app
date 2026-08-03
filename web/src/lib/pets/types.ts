export type PetSpecies = "dog" | "cat";
export type PetSex = "male" | "female";
export type WeightUnit = "kg" | "lb";

export type Pet = {
  id: string;
  owner_id: string;
  name: string;
  species: PetSpecies;
  breed: string | null;
  dob: string | null;
  estimated_age_label: string | null;
  sex: PetSex | null;
  neutered: boolean | null;
  allergies: string | null;
  notes: string | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
};

export type PetWithCurrentWeight = Pet & {
  current_weight: { value: number; unit: WeightUnit; logged_on: string } | null;
};

export type WeightEntry = {
  id: string;
  pet_id: string;
  value: number;
  unit: WeightUnit;
  logged_on: string;
  created_at: string;
};
