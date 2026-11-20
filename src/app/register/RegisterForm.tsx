"use client";

import { useActionState, useState } from "react";
import { register } from "@/app/actions/auth";
import SubmitButton from "@/components/SubmitButton";

export default function RegisterForm({ defaultRole, next }: { defaultRole: "EMPLOYER" | "APPLICANT"; next: string }) {
  const [state, formAction] = useActionState(register, undefined);
  const [role, setRole] = useState(defaultRole);
  const fe = state?.fieldErrors ?? {};

  return (
    <form action={formAction} className="card form">
      {state?.error && <div className="alert alert-error">{state.error}</div>}
      <input type="hidden" name="next" value={next} />

      <div className="field">
        <label>I want to…</label>
        <div className="role-picker">
          <label className={`role-option ${role === "APPLICANT" ? "active" : ""}`}>
            <input type="radio" name="role" value="APPLICANT" checked={role === "APPLICANT"} onChange={() => setRole("APPLICANT")} />
            <span><strong>Find a job</strong><span className="small muted">Applicant</span></span>
          </label>
          <label className={`role-option ${role === "EMPLOYER" ? "active" : ""}`}>
            <input type="radio" name="role" value="EMPLOYER" checked={role === "EMPLOYER"} onChange={() => setRole("EMPLOYER")} />
            <span><strong>Hire people</strong><span className="small muted">Employer</span></span>
          </label>
        </div>
        {fe.role && <p className="field-error">{fe.role}</p>}
      </div>

      <div className="field">
        <label htmlFor="name">Full name</label>
        <input id="name" name="name" autoComplete="name" required />
        {fe.name && <p className="field-error">{fe.name}</p>}
      </div>

      {role === "EMPLOYER" && (
        <div className="field">
          <label htmlFor="company">Company name</label>
          <input id="company" name="company" autoComplete="organization" required />
          {fe.company && <p className="field-error">{fe.company}</p>}
        </div>
      )}

      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required />
        {fe.email && <p className="field-error">{fe.email}</p>}
      </div>

      <div className="field">
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
        <p className="field-hint">At least 8 characters</p>
        {fe.password && <p className="field-error">{fe.password}</p>}
      </div>

      <SubmitButton pendingText="Creating account…" className="btn btn-primary btn-block">Create account</SubmitButton>
    </form>
  );
}
