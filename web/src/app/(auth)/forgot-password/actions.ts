"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  email: z.email("Enter a valid email address."),
});

export type FormState = { error: string } | { success: string } | null;

export async function resetPasswordForEmail(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = schema.safeParse({ email: formData.get("email") });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/reset-password`,
    },
  );

  if (error) {
    return { error: error.message };
  }

  // Deliberately generic regardless of whether the email has an account,
  // so this endpoint can't be used to check which emails are registered.
  return {
    success: "If that email has an account, a reset link is on its way.",
  };
}
