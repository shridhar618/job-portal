// Demo users and jobs, shared by `npm run db:seed` and demo mode (no DATABASE_URL).
// Fixed ids keep a login valid on every server instance in demo mode.

const ACME = "demo-employer-acme";
const NIMBUS = "demo-employer-nimbus";

export const DEMO_PASSWORD = "password123";

export const DEMO_USERS = [
  { id: ACME, name: "Priya Sharma", email: "hr@acme.com", role: "EMPLOYER", company: "Acme Technologies" },
  { id: NIMBUS, name: "Rahul Menon", email: "talent@nimbus.io", role: "EMPLOYER", company: "Nimbus Cloud" },
  { id: "demo-applicant-ananya", name: "Ananya Rao", email: "applicant@example.com", role: "APPLICANT", company: null },
];

/**
 * Insert the demo users (if missing) and, when the database has no jobs yet, the demo jobs.
 * @param {import("@prisma/client").PrismaClient} prisma
 * @param {string} passwordHash bcrypt hash of DEMO_PASSWORD
 * @returns {Promise<number>} number of jobs created (0 when jobs already existed)
 */
export async function seedDemoData(prisma, passwordHash) {
  for (const u of DEMO_USERS) {
    await prisma.user.upsert({ where: { email: u.email }, update: {}, create: { ...u, passwordHash } });
  }
  if ((await prisma.job.count()) > 0) return 0;

  const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const jobs = [
    { employerId: ACME, title: "Backend Developer (Node.js)", location: "Bengaluru", jobType: "FULL_TIME", workMode: "HYBRID", experience: "MID", salaryMin: 1200000, salaryMax: 1800000, skills: "Node.js, PostgreSQL, REST, Docker",
      description: "Design and build scalable REST APIs for our commerce platform.\n\nResponsibilities:\n- Own services end to end, from design to production\n- Write clean, tested code\n- Collaborate with frontend and data teams\n\nRequirements:\n- 2+ years with Node.js\n- Solid SQL skills" },
    { employerId: ACME, title: "Frontend Engineer (React / Next.js)", location: "Bengaluru", jobType: "FULL_TIME", workMode: "ONSITE", experience: "MID", salaryMin: 1000000, salaryMax: 1600000, skills: "React, Next.js, TypeScript, CSS",
      description: "Build delightful, accessible user interfaces with React and Next.js. You will work closely with designers to ship features weekly." },
    { employerId: ACME, title: "Data Engineering Intern", location: "Mysuru", jobType: "INTERNSHIP", workMode: "ONSITE", experience: "ENTRY", salaryMin: 240000, salaryMax: 360000, skills: "Python, SQL, Airflow",
      description: "6-month internship building data pipelines with Python and Airflow. Great opportunity for final-year students.", deadline: in30Days },
    { employerId: NIMBUS, title: "Machine Learning Engineer", location: "Remote (India)", jobType: "FULL_TIME", workMode: "REMOTE", experience: "SENIOR", salaryMin: 2500000, salaryMax: 4000000, skills: "Python, PyTorch, MLOps, LLMs",
      description: "Train, evaluate and deploy ML models that power our cloud cost-optimisation product. Experience with LLM fine-tuning and RAG is a plus." },
    { employerId: NIMBUS, title: "DevOps Engineer", location: "Hyderabad", jobType: "FULL_TIME", workMode: "HYBRID", experience: "MID", salaryMin: 1400000, salaryMax: 2200000, skills: "Kubernetes, AWS, Terraform, CI/CD",
      description: "Run and automate our multi-region Kubernetes infrastructure on AWS." },
    { employerId: NIMBUS, title: "Technical Writer (Contract)", location: "Remote", jobType: "CONTRACT", workMode: "REMOTE", experience: "ENTRY", salaryMin: 50000, salaryMax: 80000, skills: "Documentation, Markdown, APIs",
      description: "3-month contract to write developer documentation and tutorials for our public API." },
    { employerId: ACME, title: "QA Analyst (Part-time)", location: "Pune", jobType: "PART_TIME", workMode: "HYBRID", experience: "ENTRY", salaryMin: 300000, salaryMax: 450000, skills: "Manual testing, Selenium, Jira",
      description: "Part-time role testing web and mobile releases. 20 hours per week." },
  ];

  for (const [i, job] of jobs.entries()) await prisma.job.create({ data: { id: `demo-job-${i + 1}`, ...job } });
  return jobs.length;
}
