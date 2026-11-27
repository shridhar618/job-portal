import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { updateApplicationStatus } from "@/app/actions/applications";
import { APPLICATION_STATUSES, isKeyOf } from "@/lib/constants";
import { formatBytes, formatDate, timeAgo } from "@/lib/format";
import { ApplicationStatusBadge, JobStatusBadge } from "@/components/StatusBadge";
import SubmitButton from "@/components/SubmitButton";

export const dynamic = "force-dynamic";

export default async function JobApplicationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const user = await requireUser("EMPLOYER");
  const { id } = await params;
  const { status, q } = await searchParams;

  const job = await prisma.job.findUnique({ where: { id } });
  if (!job || job.employerId !== user.id) notFound();

  const statusFilter = isKeyOf(APPLICATION_STATUSES, status) ? status : undefined;
  const search = (q ?? "").trim();

  const [applications, counts] = await Promise.all([
    prisma.application.findMany({
      where: {
        jobId: id,
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(search
          ? { OR: [{ applicant: { name: { contains: search, mode: "insensitive" } } }, { applicant: { email: { contains: search, mode: "insensitive" } } }, { coverLetter: { contains: search, mode: "insensitive" } }] }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      include: { applicant: { select: { name: true, email: true } } },
    }),
    prisma.application.groupBy({ by: ["status"], where: { jobId: id }, _count: { _all: true } }),
  ]);
  const countBy = Object.fromEntries(counts.map((c) => [c.status, c._count._all]));
  const total = counts.reduce((n, c) => n + c._count._all, 0);

  const chipHref = (s?: string) => {
    const p = new URLSearchParams();
    if (s) p.set("status", s);
    if (search) p.set("q", search);
    const qs = p.toString();
    return `/employer/jobs/${id}/applications${qs ? `?${qs}` : ""}`;
  };

  return (
    <>
      <Link href="/employer" className="small">← Back to dashboard</Link>
      <div className="page-head" style={{ marginTop: 10 }}>
        <div>
          <h1>{job.title}</h1>
          <p className="muted">
            {total} application{total === 1 ? "" : "s"} · <JobStatusBadge status={job.status} />
          </p>
        </div>
        <form method="get" className="row">
          {statusFilter && <input type="hidden" name="status" value={statusFilter} />}
          <input name="q" defaultValue={search} placeholder="Search name, email…" style={{ width: 240 }} />
          <button className="btn btn-ghost" type="submit">Search</button>
        </form>
      </div>

      <div className="filter-chips">
        <Link href={chipHref()} className={`chip ${!statusFilter ? "active" : ""}`}>All ({total})</Link>
        {Object.entries(APPLICATION_STATUSES).map(([k, v]) => (
          <Link key={k} href={chipHref(k)} className={`chip ${statusFilter === k ? "active" : ""}`}>
            {v} ({countBy[k] ?? 0})
          </Link>
        ))}
      </div>

      {applications.length === 0 ? (
        <div className="card empty muted">No applications {statusFilter || search ? "match this filter" : "yet"}.</div>
      ) : (
        <div className="stack">
          {applications.map((app) => (
            <div key={app.id} className="card app-card">
              <div className="spread">
                <div>
                  <h3 style={{ margin: 0 }}>{app.applicant.name}</h3>
                  <div className="muted small">
                    <a href={`mailto:${app.applicant.email}`}>{app.applicant.email}</a>
                    {app.phone && <> · {app.phone}</>} · applied {timeAgo(app.createdAt)} ({formatDate(app.createdAt)})
                  </div>
                </div>
                <ApplicationStatusBadge status={app.status} />
              </div>

              {app.coverLetter ? (
                <div className="cover pre-wrap">{app.coverLetter}</div>
              ) : (
                <p className="muted small" style={{ margin: 0 }}>No cover letter provided.</p>
              )}

              <div className="spread">
                <div className="row">
                  <a href={`/api/resumes/${app.id}`} target="_blank" rel="noopener" className="btn btn-ghost btn-sm">
                    View resume
                  </a>
                  <a href={`/api/resumes/${app.id}?download=1`} className="btn btn-ghost btn-sm">Download</a>
                  <span className="muted small">{app.resumeName} · {formatBytes(app.resumeSize)}</span>
                </div>
                <form action={updateApplicationStatus.bind(null, app.id)} className="status-form">
                  <select name="status" defaultValue={app.status} aria-label="Application status">
                    {Object.entries(APPLICATION_STATUSES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                  <SubmitButton className="btn btn-primary btn-sm" pendingText="…">Update</SubmitButton>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
