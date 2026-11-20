import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import JobCard from "@/components/JobCard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();
  const openFilter: Prisma.JobWhereInput = { status: "OPEN", OR: [{ deadline: null }, { deadline: { gte: new Date() } }] };

  const [latest, openCount, companyCount, applicationCount] = await Promise.all([
    prisma.job.findMany({
      where: openFilter,
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { employer: { select: { company: true, name: true } } },
    }),
    prisma.job.count({ where: openFilter }),
    prisma.user.count({ where: { role: "EMPLOYER" } }),
    prisma.application.count(),
  ]);

  return (
    <>
      <section className="hero">
        <h1>Find the job that fits you.</h1>
        <p>Search open roles from growing companies and apply in minutes with your resume.</p>
        <form action="/jobs" method="get" className="hero-search">
          <input name="q" placeholder="Job title, skill or company" aria-label="Keyword" />
          <input name="location" placeholder="Location" aria-label="Location" />
          <button className="btn btn-primary" type="submit">Search jobs</button>
        </form>
        {!user && (
          <div className="hero-cta">
            <Link href="/register?role=EMPLOYER" className="btn btn-ghost">I&apos;m hiring — post a job</Link>
          </div>
        )}
        {user?.role === "EMPLOYER" && (
          <div className="hero-cta">
            <Link href="/employer/jobs/new" className="btn btn-ghost">Post a new vacancy</Link>
          </div>
        )}
      </section>

      <section className="stats">
        <div className="card stat"><strong>{openCount}</strong><span className="muted">Open positions</span></div>
        <div className="card stat"><strong>{companyCount}</strong><span className="muted">Hiring companies</span></div>
        <div className="card stat"><strong>{applicationCount}</strong><span className="muted">Applications sent</span></div>
      </section>

      <section>
        <div className="spread" style={{ marginBottom: 14 }}>
          <h2>Latest openings</h2>
          <Link href="/jobs">View all jobs →</Link>
        </div>
        {latest.length === 0 ? (
          <div className="card empty muted">No jobs posted yet.</div>
        ) : (
          <div className="job-list">
            {latest.map((job) => <JobCard key={job.id} job={job} />)}
          </div>
        )}
      </section>
    </>
  );
}
