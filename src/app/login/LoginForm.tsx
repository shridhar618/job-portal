"use client";

import { useActionState } from "react";
import { login } from "@/app/actions/auth";
import SubmitButton from "@/components/SubmitButton";

export default function LoginForm({ next }: { next: string }) {
  const [state, formAction] = useActionState(login, undefined);

  return (
    <form action={formAction} className="card form">
      {state?.error && <div className="alert alert-error">{state.error}</div>}
      <input type="hidden" name="next" value={next} />
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      <SubmitButton pendingText="Logging in…" className="btn btn-primary btn-block">Log in</SubmitButton>
    </form>
  );
}
