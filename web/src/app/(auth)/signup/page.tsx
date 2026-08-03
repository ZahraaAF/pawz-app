"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUp, type FormState } from "./actions";

const initialState: FormState = null;

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signUp, initialState);
  const success = state && "success" in state ? state.success : null;

  return (
    <div className="auth-shell">
      <div className="card auth-card">
        <h1>Create your account</h1>
        <div className="lede">Start tracking your pets&apos; health with Pawz.</div>

        {state && "error" in state && (
          <div className="form-error">{state.error}</div>
        )}
        {success && <div className="form-success">{success}</div>}

        {!success && (
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
                autoComplete="new-password"
                minLength={6}
                required
              />
            </div>
            <button
              className="btn auth-submit"
              type="submit"
              disabled={pending}
            >
              {pending ? "Creating account…" : "Sign up"}
            </button>
          </form>
        )}

        <div className="auth-links">
          <Link href="/login">Already have an account?</Link>
        </div>
      </div>
    </div>
  );
}
