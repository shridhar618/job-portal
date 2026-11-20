import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import JobCard from "@/components/JobCard";
import { EXPERIENCE_LEVELS, JOB_TYPES, PAGE_SIZE, WORK_MODES, isKeyOf } from "@/lib/constants";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function one(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v ?? "").trim();
}

export default async function JobsPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const q = one(sp.q);
  const location = one(sp.location);
  const type = one(sp.type);
  const mode = one(sp.mode);
  const exp = one(sp.exp);
  const minSalary = Number(one(sp.minSalary)) || 0;
  const sort = one(sp.sort) || "newest";
  const page = Math.max(1, Number(one(sp.page)) || 1);

  const and: Prisma.JobWhereInput[] = [
    { status: "OPEN" },
    { OR: [{ deadline: null }, { deadline: { gte: new Date() } }] },
  ];
  // SQLite "contains" is case-insensitive for ASCII text
  if (q) {
    and.push({
      OR: [
        { title: { contains: q } },
        { description: { contains: q } },
        { skills: { contains: q } },
        { employer: { company: { contains: q } } },
      ],
    });
  }
  if (location) and.push({ location: { contains: location } });
  if (isKeyOf(JOB_TYPES, type)) and.push({ jobType: type });
  if (isKeyOf(WORK_MODES, mode)) and.push({ workMode: mode });
  if (isKeyOf(EXPERIENCE_LEVELS, exp)) and.push({ experience: exp });
  if (minSalary > 0) and.push({ OR: [{ salaryMax: { gte: minSalary } }, { salaryMax: null, salaryMin: { gte: minSalary } }] });

  const where: Prisma.JobWhereInput = { AND: and };
  const orderBy: Prisma.JobOrderByWithRelationInput[] =
    sort === "salary"
      ? [{ salaryMax: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }]
      : sort === "oldest"
        ? [{ createdAt: "asc" }]
        : [{ createdAt: "desc" }];

  const [total, jobs] = await Promise.all([
    prisma.job.count({ where }),
    prisma.job.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { employer: { select: { company: true, name: true } } },
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const pageHref = (p: number) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries({ q, location, type, mode, exp, sort, minSalary: minSalary ? String(minSalary) : "" })) {
      if (v) params.set(k, v);
    }
    params.set("page", String(p));
    return `/jobs?${params.toString()}`;
  };

  return (
    <div className="jobs-layout">
      <aside className="card filters">
        <form method="get" action="/jobs" className="form">
          <h3>Search & filter</h3>
          <div className="field">
            <label htmlFor="q">Keyword</label>
            <input id="q" name="q" defaultValue={q} placeholder="Title, skill, company" />
          </div>
          <div className="field">
            <label htmlFor="location">Location</label>
            <input id="location" name="location" defaultValue={location} placeholder="Any" />
          </div>
          <div className="field">
            <label htmlFor="type">Job type</label>
            <select id="type" name="type" defaultValue={type}>
              <option value="">Any</option>
              {Object.entries(JOB_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="mode">Work mode</label>
            <select id="mode" name="mode" defaultValue={mode}>
              <option value="">Any</option>
              {Object.entries(WORK_MODES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="exp">Experience</label>
            <select id="exp" name="exp" defaultValue={exp}>
              <option value="">Any</option>
              {Object.entries(EXPERIENCE_LEVELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="minSalary">Minimum salary (₹ / year)</label>
            <select id="minSalary" name="minSalary" defaultValue={minSalary ? String(minSalary) : ""}>
              <option value="">Any</option>
              <option value="300000">₹3 L+</option>
              <option value="600000">₹6 L+</option>
              <option value="1000000">₹10 L+</option>
              <option value="1500000">₹15 L+</option>
              <option value="2500000">₹25 L+</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="sort">Sort by</label>
            <select id="sort" name="sort" defaultValue={sort}>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="salary">Highest salary</option>
            </select>
          </div>
          <button className="btn btn-primary btn-block" type="submit">Apply filters</button>
          <Link href="/jobs" className="btn btn-ghost btn-block">Reset</Link>
        </form>
      </aside>

      <section>
        <div className="spread" style={{ marginBottom: 14 }}>
          <h1 style={{ margin: 0 }}>Jobs</h1>
          <span className="muted">{total} {total === 1 ? "result" : "results"}</span>
        </div>

        {jobs.length === 0 ? (
          <div className="card empty">
            <h3>No jobs match your filters</h3>
            <p className="muted">Try a broader keyword or remove a filter.</p>
          </div>
        ) : (
          <div className="job-list">
            {jobs.map((job) => <JobCard key={job.id} job={job} />)}
          </div>
        )}

        {totalPages > 1 && (
          <nav className="pagination">
            {page > 1 ? <Link className="btn btn-ghost btn-sm" href={pageHref(page - 1)}>← Prev</Link> : <span />}
            <span className="muted small">Page {page} of {totalPages}</span>
            {page < totalPages ? <Link className="btn btn-ghost btn-sm" href={pageHref(page + 1)}>Next →</Link> : <span />}
          </nav>
        )}
      </section>
    </div>
  );
}
