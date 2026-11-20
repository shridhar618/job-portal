import Link from "next/link";
import { EXPERIENCE_LEVELS, JOB_TYPES, WORK_MODES, label } from "@/lib/constants";
import { formatSalary, timeAgo } from "@/lib/format";

export type JobCardData = {
  id: string;
  title: string;
  location: string;
  jobType: string;
  workMode: string;
  experience: string;
  salaryMin: number | null;
  salaryMax: number | null;
  skills: string;
  createdAt: Date;
  employer: { company: string | null; name: string };
};

export default function JobCard({ job }: { job: JobCardData }) {
  const company = job.employer.company ?? job.employer.name;
  const skills = job.skills ? job.skills.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 4) : [];

  return (
    <Link href={`/jobs/${job.id}`} className="card job-card">
      <div className="job-card-head">
        <div className="company-avatar" aria-hidden>
          {company.charAt(0).toUpperCase()}
        </div>
        <div>
          <h3>{job.title}</h3>
          <p className="muted">
            {company} · {job.location}
          </p>
        </div>
        <span className="muted small job-card-time">{timeAgo(job.createdAt)}</span>
      </div>
      <div className="tags">
        <span className="tag tag-accent">{label(JOB_TYPES, job.jobType)}</span>
        <span className="tag">{label(WORK_MODES, job.workMode)}</span>
        <span className="tag">{label(EXPERIENCE_LEVELS, job.experience)}</span>
        <span className="tag tag-money">{formatSalary(job.salaryMin, job.salaryMax)}</span>
      </div>
      {skills.length > 0 && (
        <p className="skills small muted">
          {skills.join(" · ")}
        </p>
      )}
    </Link>
  );
}
