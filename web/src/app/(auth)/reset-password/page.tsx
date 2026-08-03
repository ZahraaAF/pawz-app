"use client";

import { useActionState } from "react";
import { updateUser, type FormState } from "./actions";

const initialState: FormState = null;

export default function ResetPasswordPage() {
  const [state, formAction, pending] = useActionState(
    updateUser,
    initialState,
  );

  return (
    <div className="auth-shell">
      <div className="card auth-card">
        <h1>Set a new password</h1>
        <div className="lede">Choose a new password for your account.</div>

        {state?.error && <div className="form-error">{state.error}</div>}

        <form action={formAction}>
          <div className="field-group">
            <label htmlFor="password">New password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={6}
              required
            />
          </div>
          <div className="field-group">
            <label htmlFor="confirmPassword">Confirm new password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              minLength={6}
              required
            />
          </div>
          <button className="btn auth-submit" type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save new password"}
          </button>
        </form>
      </div>
    </div>
  );
}
