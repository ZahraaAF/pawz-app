"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/dal";

export type FormState = { error: string } | { success: string } | null;

function emptyToNull(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function emptyToNullBool(value: FormDataEntryValue | null): boolean | null {
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

const petSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required."),
    species: z.enum(["dog", "cat"], { message: "Species is required." }),
    breed: z.string().nullable(),
    dob: z.string().nullable(),
    estimated_age_label: z.string().nullable(),
    sex: z.enum(["male", "female"]).nullable(),
    neutered: z.boolean().nullable(),
    allergies: z.string().nullable(),
    notes: z.string().nullable(),
  })
  .refine((data) => !(data.dob && data.estimated_age_label), {
    message: "Enter a birthdate or an estimated age, not both.",
    path: ["estimated_age_label"],
  });

function parsePetForm(formData: FormData) {
  return petSchema.safeParse({
    name: formData.get("name"),
    species: formData.get("species"),
    breed: emptyToNull(formData.get("breed")),
    dob: emptyToNull(formData.get("dob")),
    estimated_age_label: emptyToNull(formData.get("estimated_age_label")),
    sex: emptyToNull(formData.get("sex")),
    neutered: emptyToNullBool(formData.get("neutered")),
    allergies: emptyToNull(formData.get("allergies")),
    notes: emptyToNull(formData.get("notes")),
  });
}

export async function createPet(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const parsed = parsePetForm(formData);

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pets")
    .insert({ ...parsed.data, owner_id: user.id })
    .select("id")
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  redirect(`/pets/${data.id}`);
}

export async function updatePet(
  petId: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const parsed = parsePetForm(formData);

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("pets")
    .update(parsed.data)
    .eq("id", petId)
    .eq("owner_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/pets/${petId}`);
  redirect(`/pets/${petId}`);
}

export async function archivePet(petId: string): Promise<void> {
  const user = await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("pets")
    .update({ archived: true })
    .eq("id", petId)
    .eq("owner_id", user.id);

  if (error) {
    throw error;
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

const weightSchema = z.object({
  value: z.coerce.number().positive("Enter a weight greater than 0."),
  unit: z.enum(["kg", "lb"]),
  logged_on: z.string().min(1, "Date is required."),
});

export async function addWeightEntry(
  petId: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const parsed = weightSchema.safeParse({
    value: formData.get("value"),
    unit: formData.get("unit"),
    logged_on: formData.get("logged_on"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();

  // RLS would also block this, but checking ownership explicitly first
  // gives a real error message instead of an opaque RLS denial.
  const { data: pet } = await supabase
    .from("pets")
    .select("id")
    .eq("id", petId)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!pet) {
    return { error: "Pet not found." };
  }

  const { error } = await supabase.from("pet_weights").insert({
    pet_id: petId,
    ...parsed.data,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/pets/${petId}`);
  return { success: "Weight logged." };
}
