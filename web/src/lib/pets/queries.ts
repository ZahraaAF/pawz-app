import { createClient } from "@/lib/supabase/server";
import type { PetWithCurrentWeight, WeightEntry } from "./types";

export async function getPetsForUser(): Promise<PetWithCurrentWeight[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pets")
    .select("*, current_weight:pet_current_weight(value, unit, logged_on)")
    .eq("archived", false)
    .order("name");

  if (error) throw error;

  return (data ?? []).map((pet) => ({
    ...pet,
    current_weight: Array.isArray(pet.current_weight)
      ? (pet.current_weight[0] ?? null)
      : (pet.current_weight ?? null),
  })) as PetWithCurrentWeight[];
}

export async function getPetById(
  petId: string,
): Promise<PetWithCurrentWeight | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pets")
    .select("*, current_weight:pet_current_weight(value, unit, logged_on)")
    .eq("id", petId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    ...data,
    current_weight: Array.isArray(data.current_weight)
      ? (data.current_weight[0] ?? null)
      : (data.current_weight ?? null),
  } as PetWithCurrentWeight;
}

export async function getWeightHistory(petId: string): Promise<WeightEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pet_weights")
    .select("*")
    .eq("pet_id", petId)
    .order("logged_on", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}
