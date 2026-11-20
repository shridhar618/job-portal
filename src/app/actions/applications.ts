"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { deleteResume, saveResume } from "@/lib/uploads";
import { APPLICATION_STATUSES, isKeyOf } from "@/lib/constants";
import type { FormState } from "@/lib/types";

export async function applyToJob(jobId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser("APPLICANT");

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) return { error: "This job no longer exists." };
  if (job.status !== "OPEN") return { error: "This job is no longer accepting applications." };
  if (job.deadline && job.deadline < new Date()) return { error: "The application deadline has passed." };

  const already = await prisma.application.findUnique({
    where: { jobId_applicantId: { jobId, applicantId: user.id } },
  });
  if (already) return { error: "You have already applied to this job." };

  const phone = String(formData.get("phone") ?? "").trim();
  const coverLetter = String(formData.get("coverLetter") ?? "").trim();
  if (phone && !/^[+\d][\d\s-]{6,18}$/.test(phone)) {
    return { fieldErrors: { phone: "Enter a valid phone number." } };
  }
  if (coverLetter.length > 5000) {
    return { fieldErrors: { coverLetter: "Cover letter must be under 5000 characters." } };
  }

  const file = formData.get("resume");
  const saved = await saveResume(file && typeof file === "object" ? (file as File) : null);
  if (!saved.ok) return { fieldErrors: { resume: saved.error } };

  try {
    await prisma.application.create({
      data: {
        jobId,
        applicantId: user.id,
        phone: phone || null,
        coverLetter,
        resumePath: saved.resume.storedName,
        resumeName: saved.resume.originalName,
        resumeMime: saved.resume.mime,
        resumeSize: saved.resume.size,
      },
    });
  } catch {
    await deleteResume(saved.resume.storedName);
    return { error: "Could not submit your application. Please try again." };
  }

  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/applications");
  revalidatePath("/employer");
  return { success: "Application submitted! You can track it under My Applications." };
}

export async function updateApplicationStatus(applicationId: string, formData: FormData) {
  const user = await requireUser("EMPLOYER");
  const status = formData.get("status");
  if (!isKeyOf(APPLICATION_STATUSES, status)) return;

  const app = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { job: { select: { employerId: true } } },
  });
  if (!app || app.job.employerId !== user.id) return;

  await prisma.application.update({ where: { id: applicationId }, data: { status } });
  revalidatePath(`/employer/jobs/${app.jobId}/applications`);
  revalidatePath("/employer");
  revalidatePath("/applications");
}

export async function withdrawApplication(applicationId: string) {
  const user = await requireUser("APPLICANT");
  const app = await prisma.application.findUnique({ where: { id: applicationId } });
  if (!app || app.applicantId !== user.id) return;

  await prisma.application.delete({ where: { id: applicationId } });
  await deleteResume(app.resumePath);
  revalidatePath("/applications");
  revalidatePath(`/jobs/${app.jobId}`);
  revalidatePath("/employer");
}
