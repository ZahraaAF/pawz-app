"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/dal";
import { addDaysToIso, todayIsoUtc } from "./format";
import { CARE_EVENT_TYPES, INTERVAL_PRESETS, type CareEventType } from "./types";

export type FormState = { error: string } | { success: string } | null;

function emptyToNull(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

const CARE_EVENT_TYPE_VALUES = CARE_EVENT_TYPES.map((t) => t.value) as [
  CareEventType,
  ...CareEventType[],
];

const reminderSchema = z
  .object({
    type: z.enum(CARE_EVENT_TYPE_VALUES),
    label: z.string().trim().min(1, "Label is required."),
    notes: z.string().nullable(),
    next_due_on: z.string().min(1, "Due date is required."),
    is_recurring: z.boolean(),
    interval_days: z.number().int().positive().nullable(),
  })
  .refine(
    (data) =>
      data.is_recurring ? data.interval_days !== null : data.interval_days === null,
    { message: "Pick how often this repeats.", path: ["interval_days"] },
  );

function parseReminderForm(formData: FormData) {
  const isRecurring = formData.get("is_recurring") === "true";
  const intervalPreset = formData.get("interval_preset");
  const customDays = formData.get("interval_days_custom");

  let intervalDays: number | null = null;
  if (isRecurring) {
    if (intervalPreset === "custom") {
      const parsed = Number(customDays);
      intervalDays = Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    } else {
      const preset = INTERVAL_PRESETS.find((p) => p.value === intervalPreset);
      intervalDays = preset?.days ?? null;
    }
  }

  return reminderSchema.safeParse({
    type: formData.get("type"),
    label: formData.get("label"),
    notes: emptyToNull(formData.get("notes")),
    next_due_on: formData.get("next_due_on"),
    is_recurring: isRecurring,
    interval_days: intervalDays,
  });
}

export async function createReminder(
  petId: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireUser();
  const parsed = parseReminderForm(formData);

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("reminder_schedules").insert({
    pet_id: petId,
    ...parsed.data,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/pets/${petId}`);
  return { success: "Reminder added." };
}

const careEventSchema = z.object({
  type: z.enum(CARE_EVENT_TYPE_VALUES),
  label: z.string().trim().min(1, "Label is required."),
  notes: z.string().nullable(),
  occurred_on: z.string().min(1, "Date is required."),
});

export async function logCareEvent(
  petId: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireUser();
  const parsed = careEventSchema.safeParse({
    type: formData.get("type"),
    label: formData.get("label"),
    notes: emptyToNull(formData.get("notes")),
    occurred_on: formData.get("occurred_on"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("care_events").insert({
    pet_id: petId,
    schedule_id: null,
    ...parsed.data,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/pets/${petId}`);
  return { success: "Logged." };
}

export async function markReminderDone(scheduleId: string): Promise<void> {
  await requireUser();
  const supabase = await createClient();

  const { data: schedule, error: fetchError } = await supabase
    .from("reminder_schedules")
    .select("*")
    .eq("id", scheduleId)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!schedule) throw new Error("Reminder not found.");

  const today = todayIsoUtc();

  const { error: insertError } = await supabase.from("care_events").insert({
    pet_id: schedule.pet_id,
    schedule_id: schedule.id,
    type: schedule.type,
    label: schedule.label,
    occurred_on: today,
    notes: null,
  });

  if (insertError) throw insertError;

  const update = schedule.is_recurring
    ? { next_due_on: addDaysToIso(today, schedule.interval_days as number) }
    : { active: false };

  const { error: updateError } = await supabase
    .from("reminder_schedules")
    .update(update)
    .eq("id", scheduleId);

  if (updateError) throw updateError;

  revalidatePath("/dashboard");
  revalidatePath(`/pets/${schedule.pet_id}`);
}

export async function cancelReminder(scheduleId: string): Promise<void> {
  await requireUser();
  const supabase = await createClient();

  const { data: schedule, error: fetchError } = await supabase
    .from("reminder_schedules")
    .select("pet_id")
    .eq("id", scheduleId)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!schedule) throw new Error("Reminder not found.");

  const { error } = await supabase
    .from("reminder_schedules")
    .update({ active: false })
    .eq("id", scheduleId);

  if (error) throw error;

  revalidatePath("/dashboard");
  revalidatePath(`/pets/${schedule.pet_id}`);
}
