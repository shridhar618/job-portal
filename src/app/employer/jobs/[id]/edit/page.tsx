import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { updateJob } from "@/app/actions/jobs";
import { toDateInputValue } from "@/lib/format";
import JobForm from "@/components/JobForm";

export default async function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser("EMPLOYER");
  const { id } = await params;
  const job = await prisma.job.findUnique({ where: { id } });
  if (!job || job.employerId !== user.id) notFound();

  return (
    <div style={{ maxWidth: 820, margin: "0 auto" }}>
      <h1>Edit job</h1>
      <p className="muted">{job.title}</p>
      <JobForm
        action={updateJob.bind(null, job.id)}
        submitLabel="Save changes"
        initial={{
          title: job.title,
          description: job.description,
          location: job.location,
          jobType: job.jobType,
          workMode: job.workMode,
          experience: job.experience,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          skills: job.skills,
          deadline: toDateInputValue(job.deadline),
        }}
      />
    </div>
  );
}
