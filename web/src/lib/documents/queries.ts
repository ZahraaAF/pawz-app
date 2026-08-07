import { createClient } from "@/lib/supabase/server";
import type { DocumentWithLink } from "./types";

export async function getDocumentsForPet(petId: string): Promise<DocumentWithLink[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("documents")
    .select(
      "*, care_event:care_events(id, label), symptom_entry:symptom_entries(id, description, occurred_at)",
    )
    .eq("pet_id", petId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as DocumentWithLink[];
}
