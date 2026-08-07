import { createClient } from "@/lib/supabase/server";
import type { SymptomEntry } from "./types";

export async function getSymptomsForPet(petId: string): Promise<SymptomEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("symptom_entries")
    .select("*")
    .eq("pet_id", petId)
    .order("occurred_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getSymptomsForPetInRange(
  petId: string,
  fromIso: string,
  toIso: string,
): Promise<SymptomEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("symptom_entries")
    .select("*")
    .eq("pet_id", petId)
    .gte("occurred_at", fromIso)
    .lte("occurred_at", toIso)
    .order("occurred_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}
