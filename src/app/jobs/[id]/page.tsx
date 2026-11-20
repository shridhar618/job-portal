import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { applyToJob } from "@/app/actions/applications";
import { EXPERIENCE_LEVELS, JOB_TYPES, WORK_MODES, label } from "@/lib/constants";
import { formatDate, formatSalary, timeAgo } from "@/lib/format";
import { ApplicationStatusBadge, JobStatusBadge } from "@/components/StatusBadge";
import ApplyForm from "./ApplyForm";

export const dynamic = "force-dynamic";

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [job, user] = await Promise.all([
    prisma.job.findUnique({
      where: { id },
      include: {
        employer: { select: { company: true, name: true } },
        _count: { select: { applications: true } },
      },
    }),
    getCurrentUser(),
  ]);
  if (!job) notFound();

  const isOwner = user?.role === "EMPLOYER" && user.id === job.employerId;
  // Closed jobs are only visible to their owner
  if (job.status !== "OPEN" && !isOwner) {
    const hasApplied = user ? await prisma.application.count({ where: { jobId: id, applicantId: user.id } }) : 0;
    if (!hasApplied) notFound();
  }

  const existing =
    user?.role === "APPLICANT"
      ? await prisma.application.findUnique({ where: { jobId_applicantId: { jobId: id, applicantId: user.id } } })
      : null;

  const company = job.employer.company ?? job.employer.name;
  const deadlinePassed = !!job.deadline && job.deadline < new Date();
  const accepting = job.status === "OPEN" && !deadlinePassed;
  const skills = job.skills ? job.skills.split(",").map((s) => s.trim()).filter(Boolean) : [];

  return (
    <div className="detail-layout">
      <article className="card">
        <Link href="/jobs" className="small">← Back to jobs</Link>
        <div className="detail-head" style={{ marginTop: 14 }}>
          <div className="company-avatar lg" aria-hidden>{company.charAt(0).toUpperCase()}</div>
          <div>
            <h1 style={{ marginBottom: 4 }}>{job.title}</h1>
            <p className="muted" style={{ margin: 0 }}>
              {company} · {job.location} · posted {timeAgo(job.createdAt)}
            </p>
          </div>
        </div>

        <div className="tags">
          <span className="tag tag-accent">{label(JOB_TYPES, job.jobType)}</span>
          <span className="tag">{label(WORK_MODES, job.workMode)}</span>
          <span className="tag">{label(EXPERIENCE_LEVELS, job.experience)}</span>
          {job.status !== "OPEN" && <JobStatusBadge status={job.status} />}
        </div>

        <div className="facts">
          <div className="fact"><span>Salary (per year)</span><strong>{formatSalary(job.salaryMin, job.salaryMax)}</strong></div>
          <div className="fact"><span>Apply by</span><strong>{job.deadline ? formatDate(job.deadline) : "Open until filled"}</strong></div>
          <div className="fact"><span>Applicants</span><strong>{job._count.applications}</strong></div>
          <div className="fact"><span>Location</span><strong>{job.location}</strong></div>
        </div>

        {skills.length > 0 && (
          <>
            <h3>Skills</h3>
            <div className="tags" style={{ marginBottom: 18 }}>
              {skills.map((s) => <span key={s} className="tag">{s}</span>)}
            </div>
          </>
        )}

        <h3>About the role</h3>
        <div className="pre-wrap">{job.description}</div>
      </article>

      <aside className="card apply-box">
        {isOwner ? (
          <div className="stack">
            <h3>You posted this job</h3>
            <Link href={`/employer/jobs/${job.id}/applications`} className="btn btn-primary">
              View {job._count.applications} application{job._count.applications === 1 ? "" : "s"}
            </Link>
            <Link href={`/employer/jobs/${job.id}/edit`} className="btn btn-ghost">Edit job</Link>
          </div>
        ) : user?.role === "EMPLOYER" ? (
          <p className="muted">Log in with an applicant account to apply for jobs.</p>
        ) : existing ? (
          <div className="stack">
            <h3>Application sent</h3>
            <p className="muted" style={{ margin: 0 }}>Applied {timeAgo(existing.createdAt)}</p>
            <div>Status: <ApplicationStatusBadge status={existing.status} /></div>
            <Link href="/applications" className="btn btn-ghost">Track my applications</Link>
          </div>
        ) : !accepting ? (
          <div className="alert alert-info">This job is no longer accepting applications.</div>
        ) : !user ? (
          <div className="stack">
            <h3>Interested in this role?</h3>
            <p className="muted" style={{ margin: 0 }}>Log in or create a free applicant account to apply.</p>
            <Link href={`/login?next=/jobs/${job.id}`} className="btn btn-primary">Log in to apply</Link>
            <Link href={`/register?role=APPLICANT&next=/jobs/${job.id}`} className="btn btn-ghost">Create account</Link>
          </div>
        ) : (
          <>
            <h3>Apply for this job</h3>
            <ApplyForm action={applyToJob.bind(null, job.id)} />
          </>
        )}
      </aside>
    </div>
  );
}
