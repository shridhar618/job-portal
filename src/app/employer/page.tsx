import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { deleteJob, toggleJobStatus } from "@/app/actions/jobs";
import { JOB_TYPES, label } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { JobStatusBadge } from "@/components/StatusBadge";
import SubmitButton from "@/components/SubmitButton";

export const dynamic = "force-dynamic";

export default async function EmployerDashboard() {
  const user = await requireUser("EMPLOYER");

  const jobs = await prisma.job.findMany({
    where: { employerId: user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { applications: true } } },
  });

  const newCounts = await prisma.application.groupBy({
    by: ["jobId"],
    where: { job: { employerId: user.id }, status: "SUBMITTED" },
    _count: { _all: true },
  });
  const newByJob = new Map(newCounts.map((c) => [c.jobId, c._count._all]));

  const totalApps = jobs.reduce((n, j) => n + j._count.applications, 0);
  const totalNew = newCounts.reduce((n, c) => n + c._count._all, 0);
  const openJobs = jobs.filter((j) => j.status === "OPEN").length;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Employer dashboard</h1>
          <p className="muted">{user.company} · manage your vacancies and applicants</p>
        </div>
        <Link href="/employer/jobs/new" className="btn btn-primary">+ Post a job</Link>
      </div>

      <div className="stat-grid">
        <div className="card"><span className="muted small">Total jobs</span><strong>{jobs.length}</strong></div>
        <div className="card"><span className="muted small">Open jobs</span><strong>{openJobs}</strong></div>
        <div className="card"><span className="muted small">Applications</span><strong>{totalApps}</strong></div>
        <div className="card"><span className="muted small">New (unreviewed)</span><strong>{totalNew}</strong></div>
      </div>

      {jobs.length === 0 ? (
        <div className="card empty">
          <h3>You haven&apos;t posted any jobs yet</h3>
          <p className="muted">Create your first vacancy to start receiving applications.</p>
          <Link href="/employer/jobs/new" className="btn btn-primary">Post a job</Link>
        </div>
      ) : (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>Job</th>
                <th>Status</th>
                <th>Applicants</th>
                <th>Posted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => {
                const fresh = newByJob.get(job.id) ?? 0;
                return (
                  <tr key={job.id}>
                    <td>
                      <Link href={`/jobs/${job.id}`}><strong>{job.title}</strong></Link>
                      <div className="muted small">{label(JOB_TYPES, job.jobType)} · {job.location}</div>
                    </td>
                    <td><JobStatusBadge status={job.status} /></td>
                    <td>
                      <Link href={`/employer/jobs/${job.id}/applications`}>{job._count.applications}</Link>
                      {fresh > 0 && <span className="badge badge-submitted" style={{ marginLeft: 6 }}>{fresh} new</span>}
                    </td>
                    <td className="muted small">{formatDate(job.createdAt)}</td>
                    <td>
                      <div className="actions-cell">
                        <Link href={`/employer/jobs/${job.id}/applications`} className="btn btn-ghost btn-sm">Applicants</Link>
                        <Link href={`/employer/jobs/${job.id}/edit`} className="btn btn-ghost btn-sm">Edit</Link>
                        <form action={toggleJobStatus.bind(null, job.id)}>
                          <SubmitButton className="btn btn-ghost btn-sm" pendingText="…">
                            {job.status === "OPEN" ? "Close" : "Reopen"}
                          </SubmitButton>
                        </form>
                        <form action={deleteJob.bind(null, job.id)}>
                          <SubmitButton
                            className="btn btn-danger btn-sm"
                            pendingText="Deleting…"
                            confirmMessage={`Delete "${job.title}" and all of its applications? This cannot be undone.`}
                          >
                            Delete
                          </SubmitButton>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
