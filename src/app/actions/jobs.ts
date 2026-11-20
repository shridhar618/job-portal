"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { deleteResume } from "@/lib/uploads";
import { EXPERIENCE_LEVELS, JOB_TYPES, WORK_MODES, isKeyOf } from "@/lib/constants";
import type { FormState } from "@/lib/types";

type JobInput = {
  title: string;
  description: string;
  location: string;
  jobType: string;
  workMode: string;
  experience: string;
  salaryMin: number | null;
  salaryMax: number | null;
  skills: string;
  deadline: Date | null;
};

function parseMoney(v: FormDataEntryValue | null): number | null | "invalid" {
  const s = String(v ?? "").replace(/[,\s]/g, "");
  if (!s) return null;
  const n = Number(s);
  return Number.isInteger(n) && n >= 0 ? n : "invalid";
}

function parseJob(formData: FormData): { data: JobInput } | { fieldErrors: Record<string, string> } {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const jobType = formData.get("jobType");
  const workMode = formData.get("workMode");
  const experience = formData.get("experience");
  const salaryMin = parseMoney(formData.get("salaryMin"));
  const salaryMax = parseMoney(formData.get("salaryMax"));
  const skills = String(formData.get("skills") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .join(", ");
  const deadlineRaw = String(formData.get("deadline") ?? "");

  const fieldErrors: Record<string, string> = {};
  if (title.length < 3) fieldErrors.title = "Title must be at least 3 characters.";
  if (description.length < 20) fieldErrors.description = "Description must be at least 20 characters.";
  if (location.length < 2) fieldErrors.location = "Enter a location.";
  if (!isKeyOf(JOB_TYPES, jobType)) fieldErrors.jobType = "Choose a job type.";
  if (!isKeyOf(WORK_MODES, workMode)) fieldErrors.workMode = "Choose a work mode.";
  if (!isKeyOf(EXPERIENCE_LEVELS, experience)) fieldErrors.experience = "Choose an experience level.";
  if (salaryMin === "invalid") fieldErrors.salaryMin = "Enter a whole number.";
  if (salaryMax === "invalid") fieldErrors.salaryMax = "Enter a whole number.";
  if (typeof salaryMin === "number" && typeof salaryMax === "number" && salaryMin > salaryMax) {
    fieldErrors.salaryMax = "Maximum must be greater than minimum.";
  }

  let deadline: Date | null = null;
  if (deadlineRaw) {
    const d = new Date(`${deadlineRaw}T23:59:59`);
    if (Number.isNaN(d.getTime())) fieldErrors.deadline = "Invalid date.";
    else deadline = d;
  }

  if (Object.keys(fieldErrors).length) return { fieldErrors };

  return {
    data: {
      title,
      description,
      location,
      jobType: jobType as string,
      workMode: workMode as string,
      experience: experience as string,
      salaryMin: salaryMin as number | null,
      salaryMax: salaryMax as number | null,
      skills,
      deadline,
    },
  };
}

async function getOwnedJob(jobId: string) {
  const user = await requireUser("EMPLOYER");
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job || job.employerId !== user.id) throw new Error("Job not found");
  return job;
}

export async function createJob(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser("EMPLOYER");
  const parsed = parseJob(formData);
  if ("fieldErrors" in parsed) return { fieldErrors: parsed.fieldErrors, error: "Please fix the highlighted fields." };

  await prisma.job.create({ data: { ...parsed.data, employerId: user.id } });
  revalidatePath("/jobs");
  revalidatePath("/employer");
  redirect("/employer");
}

export async function updateJob(jobId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await getOwnedJob(jobId);
  const parsed = parseJob(formData);
  if ("fieldErrors" in parsed) return { fieldErrors: parsed.fieldErrors, error: "Please fix the highlighted fields." };

  await prisma.job.update({ where: { id: jobId }, data: parsed.data });
  revalidatePath("/jobs");
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/employer");
  redirect("/employer");
}

export async function toggleJobStatus(jobId: string) {
  const job = await getOwnedJob(jobId);
  await prisma.job.update({
    where: { id: jobId },
    data: { status: job.status === "OPEN" ? "CLOSED" : "OPEN" },
  });
  revalidatePath("/jobs");
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/employer");
}

export async function deleteJob(jobId: string) {
  await getOwnedJob(jobId);
  const apps = await prisma.application.findMany({ where: { jobId }, select: { resumePath: true } });
  await prisma.job.delete({ where: { id: jobId } }); // applications cascade
  await Promise.all(apps.map((a) => deleteResume(a.resumePath)));
  revalidatePath("/jobs");
  revalidatePath("/employer");
}
