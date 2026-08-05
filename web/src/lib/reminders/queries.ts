import { createClient } from "@/lib/supabase/server";
import type { CareEvent, CareEventWithPet, ReminderSchedule, ReminderWithPet } from "./types";

export async function getRemindersForPet(petId: string): Promise<ReminderSchedule[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reminder_schedules")
    .select("*")
    .eq("pet_id", petId)
    .eq("active", true)
    .order("next_due_on");

  if (error) throw error;
  return data ?? [];
}

export async function getCareEventsForPet(petId: string): Promise<CareEvent[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("care_events")
    .select("*")
    .eq("pet_id", petId)
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getOverdueAndUpcomingReminders(): Promise<{
  overdue: ReminderWithPet[];
  upcoming: ReminderWithPet[];
}> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("reminder_schedules")
    .select("*, pets!inner(id, name, archived)")
    .eq("active", true)
    .eq("pets.archived", false)
    .order("next_due_on");

  if (error) throw error;

  const reminders = (data ?? []) as ReminderWithPet[];
  const overdue = reminders.filter((r) => r.next_due_on < today);
  const upcoming = reminders.filter((r) => r.next_due_on >= today);

  return { overdue, upcoming };
}

export async function getRecentCareEvents(limit = 15): Promise<CareEventWithPet[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("care_events")
    .select("*, pets!inner(id, name, archived)")
    .eq("pets.archived", false)
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as CareEventWithPet[];
}
