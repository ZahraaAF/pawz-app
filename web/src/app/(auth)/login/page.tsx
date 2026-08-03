"use client";

import Link from "next/link";
import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { signInWithPassword, type FormState } from "./actions";

const initialState: FormState = null;

const NOTICE_MESSAGES: Record<string, string> = {
  "password-updated": "Password updated — log in with your new password.",
};

const NOTICE_ERRORS: Record<string, string> = {
  "auth-callback-failed": "That link is invalid or has expired. Please try again.",
};

function LoginNotices() {
  const searchParams = useSearchParams();
  const message = NOTICE_MESSAGES[searchParams.get("message") ?? ""];
  const error = NOTICE_ERRORS[searchParams.get("error") ?? ""];

  return (
    <>
      {message && <div className="form-success">{message}</div>}
      {error && <div className="form-error">{error}</div>}
    </>
  );
}

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(
    signInWithPassword,
    initialState,
  );

  return (
    <div className="auth-shell">
      <div className="card auth-card">
        <h1>Welcome back</h1>
        <div className="lede">Log in to Pawz.</div>

        <Suspense fallback={null}>
          <LoginNotices />
        </Suspense>

        {state?.error && <div className="form-error">{state.error}</div>}

        <form action={formAction}>
          <div className="field-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </div>
          <div className="field-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          <button className="btn auth-submit" type="submit" disabled={pending}>
            {pending ? "Logging in…" : "Log in"}
          </button>
        </form>

        <div className="auth-links">
          <Link href="/forgot-password">Forgot password?</Link>
          <Link href="/signup">Create an account</Link>
        </div>
      </div>
    </div>
  );
}
