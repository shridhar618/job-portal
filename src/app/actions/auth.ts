"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession } from "@/lib/auth";
import type { FormState } from "@/lib/types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function safeNext(next: FormDataEntryValue | null): string | null {
  const v = typeof next === "string" ? next : "";
  return v.startsWith("/") && !v.startsWith("//") ? v : null;
}

export async function register(_prev: FormState, formData: FormData): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "");
  const company = String(formData.get("company") ?? "").trim();

  const fieldErrors: Record<string, string> = {};
  if (name.length < 2) fieldErrors.name = "Enter your full name.";
  if (!EMAIL_RE.test(email)) fieldErrors.email = "Enter a valid email address.";
  if (password.length < 8) fieldErrors.password = "Password must be at least 8 characters.";
  if (role !== "EMPLOYER" && role !== "APPLICANT") fieldErrors.role = "Choose an account type.";
  if (role === "EMPLOYER" && company.length < 2) fieldErrors.company = "Enter your company name.";
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return { fieldErrors: { email: "An account with this email already exists." } };

  const user = await prisma.user.create({
    data: {
      name,
      email,
      role,
      company: role === "EMPLOYER" ? company : null,
      passwordHash: await bcrypt.hash(password, 10),
    },
  });

  await createSession(user.id);
  redirect(safeNext(formData.get("next")) ?? (role === "EMPLOYER" ? "/employer" : "/jobs"));
}

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));

  if (!email || !password) return { error: "Enter your email and password." };

  const user = await prisma.user.findUnique({ where: { email } });
  const valid = user ? await bcrypt.compare(password, user.passwordHash) : false;
  if (!user || !valid) return { error: "Incorrect email or password." };

  await createSession(user.id);
  redirect(next ?? (user.role === "EMPLOYER" ? "/employer" : "/jobs"));
}

export async function logout() {
  await destroySession();
  redirect("/");
}
