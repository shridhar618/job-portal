import { requireUser } from "@/lib/auth";
import { createJob } from "@/app/actions/jobs";
import JobForm from "@/components/JobForm";

export default async function NewJobPage() {
  await requireUser("EMPLOYER");
  return (
    <div style={{ maxWidth: 820, margin: "0 auto" }}>
      <h1>Post a new job</h1>
      <p className="muted">Fill in the details below. The job goes live immediately.</p>
      <JobForm action={createJob} submitLabel="Publish job" />
    </div>
  );
}
