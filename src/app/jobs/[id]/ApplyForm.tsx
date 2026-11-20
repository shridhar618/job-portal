"use client";

import { useActionState } from "react";
import Link from "next/link";
import SubmitButton from "@/components/SubmitButton";
import type { FormState } from "@/lib/types";

type Props = { action: (prev: FormState, formData: FormData) => Promise<FormState> };

export default function ApplyForm({ action }: Props) {
  const [state, formAction] = useActionState(action, undefined);
  const fe = state?.fieldErrors ?? {};

  if (state?.success) {
    return (
      <div className="stack">
        <div className="alert alert-success">{state.success}</div>
        <Link href="/applications" className="btn btn-primary">Go to My Applications</Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="form">
      {state?.error && <div className="alert alert-error">{state.error}</div>}

      <div className="field">
        <label htmlFor="resume">Resume *</label>
        <input id="resume" name="resume" type="file" accept=".pdf,.doc,.docx" required />
        <p className="field-hint">PDF, DOC or DOCX · max 5 MB</p>
        {fe.resume && <p className="field-error">{fe.resume}</p>}
      </div>

      <div className="field">
        <label htmlFor="phone">Phone</label>
        <input id="phone" name="phone" type="tel" placeholder="+91 98765 43210" />
        {fe.phone && <p className="field-error">{fe.phone}</p>}
      </div>

      <div className="field">
        <label htmlFor="coverLetter">Cover letter</label>
        <textarea id="coverLetter" name="coverLetter" rows={6} placeholder="Why are you a good fit for this role?" maxLength={5000} />
        {fe.coverLetter && <p className="field-error">{fe.coverLetter}</p>}
      </div>

      <SubmitButton pendingText="Submitting…" className="btn btn-primary btn-block">Submit application</SubmitButton>
    </form>
  );
}
