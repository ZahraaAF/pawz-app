"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match.",
    path: ["confirmPassword"],
  });

export type FormState = { error: string } | null;

export async function updateUser(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = schema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { error: error.message };
  }

  // The recovery link's session only proves you clicked the email — it
  // must not become a standing login. Sign out so the new password has
  // to actually be used once before the account is accessible.
  await supabase.auth.signOut();
  redirect("/login?message=password-updated");
}
