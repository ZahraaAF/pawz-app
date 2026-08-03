"use client";

import Link from "next/link";
import { useActionState } from "react";
import { resetPasswordForEmail, type FormState } from "./actions";

const initialState: FormState = null;

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(
    resetPasswordForEmail,
    initialState,
  );
  const success = state && "success" in state ? state.success : null;

  return (
    <div className="auth-shell">
      <div className="card auth-card">
        <h1>Reset your password</h1>
        <div className="lede">
          We&apos;ll email you a link to set a new password.
        </div>

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
            <button
              className="btn auth-submit"
              type="submit"
              disabled={pending}
            >
              {pending ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}

        <div className="auth-links">
          <Link href="/login">Back to login</Link>
        </div>
      </div>
    </div>
  );
}
