import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Proxy is the fast-path UX redirect; a matcher misconfiguration can
// silently stop covering a route, so every Server Action and
// data-fetching Server Component must independently re-verify auth
// by calling one of these rather than trusting proxy alone.

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function requireUser() {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}
