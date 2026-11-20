"use client";

import { useActionState } from "react";
import Link from "next/link";
import SubmitButton from "./SubmitButton";
import { EXPERIENCE_LEVELS, JOB_TYPES, WORK_MODES } from "@/lib/constants";
import type { FormState } from "@/lib/types";

export type JobFormValues = {
  title: string;
  description: string;
  location: string;
  jobType: string;
  workMode: string;
  experience: string;
  salaryMin: number | null;
  salaryMax: number | null;
  skills: string;
  deadline: string; // yyyy-mm-dd
};

type Props = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  initial?: JobFormValues;
  submitLabel: string;
};

export default function JobForm({ action, initial, submitLabel }: Props) {
  const [state, formAction] = useActionState(action, undefined);
  const fe = state?.fieldErrors ?? {};

  return (
    <form action={formAction} className="card form" noValidate>
      {state?.error && <div className="alert alert-error">{state.error}</div>}

      <div className="field">
        <label htmlFor="title">Job title *</label>
        <input id="title" name="title" defaultValue={initial?.title} placeholder="e.g. Backend Developer" required />
        {fe.title && <p className="field-error">{fe.title}</p>}
      </div>

      <div className="grid-3">
        <div className="field">
          <label htmlFor="jobType">Job type *</label>
          <select id="jobType" name="jobType" defaultValue={initial?.jobType ?? "FULL_TIME"}>
            {Object.entries(JOB_TYPES).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          {fe.jobType && <p className="field-error">{fe.jobType}</p>}
        </div>
        <div className="field">
          <label htmlFor="workMode">Work mode *</label>
          <select id="workMode" name="workMode" defaultValue={initial?.workMode ?? "ONSITE"}>
            {Object.entries(WORK_MODES).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          {fe.workMode && <p className="field-error">{fe.workMode}</p>}
        </div>
        <div className="field">
          <label htmlFor="experience">Experience *</label>
          <select id="experience" name="experience" defaultValue={initial?.experience ?? "ENTRY"}>
            {Object.entries(EXPERIENCE_LEVELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          {fe.experience && <p className="field-error">{fe.experience}</p>}
        </div>
      </div>

      <div className="grid-2">
        <div className="field">
          <label htmlFor="location">Location *</label>
          <input id="location" name="location" defaultValue={initial?.location} placeholder="e.g. Bengaluru" required />
          {fe.location && <p className="field-error">{fe.location}</p>}
        </div>
        <div className="field">
          <label htmlFor="deadline">Application deadline</label>
          <input id="deadline" name="deadline" type="date" defaultValue={initial?.deadline} />
          {fe.deadline && <p className="field-error">{fe.deadline}</p>}
        </div>
      </div>

      <div className="grid-2">
        <div className="field">
          <label htmlFor="salaryMin">Salary min (₹ / year)</label>
          <input id="salaryMin" name="salaryMin" inputMode="numeric" defaultValue={initial?.salaryMin ?? ""} placeholder="600000" />
          {fe.salaryMin && <p className="field-error">{fe.salaryMin}</p>}
        </div>
        <div className="field">
          <label htmlFor="salaryMax">Salary max (₹ / year)</label>
          <input id="salaryMax" name="salaryMax" inputMode="numeric" defaultValue={initial?.salaryMax ?? ""} placeholder="1200000" />
          {fe.salaryMax && <p className="field-error">{fe.salaryMax}</p>}
        </div>
      </div>

      <div className="field">
        <label htmlFor="skills">Skills (comma separated)</label>
        <input id="skills" name="skills" defaultValue={initial?.skills} placeholder="React, Node.js, SQL" />
      </div>

      <div className="field">
        <label htmlFor="description">Description *</label>
        <textarea
          id="description"
          name="description"
          rows={10}
          defaultValue={initial?.description}
          placeholder="Role overview, responsibilities, requirements, benefits…"
          required
        />
        {fe.description && <p className="field-error">{fe.description}</p>}
      </div>

      <div className="form-actions">
        <Link href="/employer" className="btn btn-ghost">Cancel</Link>
        <SubmitButton>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
