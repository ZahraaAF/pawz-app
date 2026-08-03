import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }

    // A stale/reused code must not leave an earlier session standing —
    // otherwise proxy.ts's "already logged in" redirect silently bounces
    // this failure straight to /dashboard instead of showing the error.
    await supabase.auth.signOut();
  }

  return NextResponse.redirect(`${origin}/login?error=auth-callback-failed`);
}
