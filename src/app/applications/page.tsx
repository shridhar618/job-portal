import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { withdrawApplication } from "@/app/actions/applications";
import { formatDate } from "@/lib/format";
import { ApplicationStatusBadge } from "@/components/StatusBadge";
import SubmitButton from "@/components/SubmitButton";

export const dynamic = "force-dynamic";

export default async function MyApplicationsPage() {
  const user = await requireUser("APPLICANT");

  const applications = await prisma.application.findMany({
    where: { applicantId: user.id },
    orderBy: { createdAt: "desc" },
    include: { job: { include: { employer: { select: { company: true, name: true } } } } },
  });

  return (
    <>
      <div className="page-head">
        <div>
          <h1>My applications</h1>
          <p className="muted">Track the status of every job you&apos;ve applied to.</p>
        </div>
        <Link href="/jobs" className="btn btn-primary">Find more jobs</Link>
      </div>

      {applications.length === 0 ? (
        <div className="card empty">
          <h3>No applications yet</h3>
          <p className="muted">Browse open roles and apply with your resume.</p>
          <Link href="/jobs" className="btn btn-primary">Browse jobs</Link>
        </div>
      ) : (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>Job</th>
                <th>Applied on</th>
                <th>Resume</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.id}>
                  <td>
                    <Link href={`/jobs/${app.jobId}`}><strong>{app.job.title}</strong></Link>
                    <div className="muted small">
                      {app.job.employer.company ?? app.job.employer.name} · {app.job.location}
                      {app.job.status === "CLOSED" && " · position closed"}
                    </div>
                  </td>
                  <td className="small">{formatDate(app.createdAt)}</td>
                  <td className="small">
                    <a href={`/api/resumes/${app.id}`} target="_blank" rel="noopener">{app.resumeName}</a>
                  </td>
                  <td><ApplicationStatusBadge status={app.status} /></td>
                  <td>
                    {(app.status === "SUBMITTED" || app.status === "REVIEWING") && (
                      <form action={withdrawApplication.bind(null, app.id)}>
                        <SubmitButton
                          className="btn btn-danger btn-sm"
                          pendingText="…"
                          confirmMessage="Withdraw this application? Your resume will be removed."
                        >
                          Withdraw
                        </SubmitButton>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
