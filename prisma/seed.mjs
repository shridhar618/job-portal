import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  const acme = await prisma.user.upsert({
    where: { email: "hr@acme.com" },
    update: {},
    create: { name: "Priya Sharma", email: "hr@acme.com", passwordHash, role: "EMPLOYER", company: "Acme Technologies" },
  });
  const nimbus = await prisma.user.upsert({
    where: { email: "talent@nimbus.io" },
    update: {},
    create: { name: "Rahul Menon", email: "talent@nimbus.io", passwordHash, role: "EMPLOYER", company: "Nimbus Cloud" },
  });
  await prisma.user.upsert({
    where: { email: "applicant@example.com" },
    update: {},
    create: { name: "Ananya Rao", email: "applicant@example.com", passwordHash, role: "APPLICANT" },
  });

  const existing = await prisma.job.count();
  if (existing > 0) {
    console.log("Jobs already seeded, skipping.");
    return;
  }

  const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const jobs = [
    { employerId: acme.id, title: "Backend Developer (Node.js)", location: "Bengaluru", jobType: "FULL_TIME", workMode: "HYBRID", experience: "MID", salaryMin: 1200000, salaryMax: 1800000, skills: "Node.js, PostgreSQL, REST, Docker",
      description: "Design and build scalable REST APIs for our commerce platform.\n\nResponsibilities:\n- Own services end to end, from design to production\n- Write clean, tested code\n- Collaborate with frontend and data teams\n\nRequirements:\n- 2+ years with Node.js\n- Solid SQL skills" },
    { employerId: acme.id, title: "Frontend Engineer (React / Next.js)", location: "Bengaluru", jobType: "FULL_TIME", workMode: "ONSITE", experience: "MID", salaryMin: 1000000, salaryMax: 1600000, skills: "React, Next.js, TypeScript, CSS",
      description: "Build delightful, accessible user interfaces with React and Next.js. You will work closely with designers to ship features weekly." },
    { employerId: acme.id, title: "Data Engineering Intern", location: "Mysuru", jobType: "INTERNSHIP", workMode: "ONSITE", experience: "ENTRY", salaryMin: 240000, salaryMax: 360000, skills: "Python, SQL, Airflow",
      description: "6-month internship building data pipelines with Python and Airflow. Great opportunity for final-year students.", deadline: in30Days },
    { employerId: nimbus.id, title: "Machine Learning Engineer", location: "Remote (India)", jobType: "FULL_TIME", workMode: "REMOTE", experience: "SENIOR", salaryMin: 2500000, salaryMax: 4000000, skills: "Python, PyTorch, MLOps, LLMs",
      description: "Train, evaluate and deploy ML models that power our cloud cost-optimisation product. Experience with LLM fine-tuning and RAG is a plus." },
    { employerId: nimbus.id, title: "DevOps Engineer", location: "Hyderabad", jobType: "FULL_TIME", workMode: "HYBRID", experience: "MID", salaryMin: 1400000, salaryMax: 2200000, skills: "Kubernetes, AWS, Terraform, CI/CD",
      description: "Run and automate our multi-region Kubernetes infrastructure on AWS." },
    { employerId: nimbus.id, title: "Technical Writer (Contract)", location: "Remote", jobType: "CONTRACT", workMode: "REMOTE", experience: "ENTRY", salaryMin: 50000, salaryMax: 80000, skills: "Documentation, Markdown, APIs",
      description: "3-month contract to write developer documentation and tutorials for our public API." },
    { employerId: acme.id, title: "QA Analyst (Part-time)", location: "Pune", jobType: "PART_TIME", workMode: "HYBRID", experience: "ENTRY", salaryMin: 300000, salaryMax: 450000, skills: "Manual testing, Selenium, Jira",
      description: "Part-time role testing web and mobile releases. 20 hours per week." },
  ];

  for (const job of jobs) await prisma.job.create({ data: job });
  console.log(`Seeded ${jobs.length} jobs and 3 users (password: password123).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
