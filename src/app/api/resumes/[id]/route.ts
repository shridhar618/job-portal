import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { readResume } from "@/lib/uploads";
import { isDemoMode } from "@/lib/prisma";

// In demo mode each server instance has its own temporary data, so this route may not see
// an application that a page on another instance just created.
const DEMO_MISSING = "Demo mode: this resume isn't available on this server. Data is temporary in the demo.";

// Only the applicant who uploaded the resume, or the employer who owns the job, can access it.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  const app = await prisma.application.findUnique({
    where: { id },
    include: { job: { select: { employerId: true } } },
  });
  if (!app) return new Response(isDemoMode ? DEMO_MISSING : "Not found", { status: 404 });

  const allowed = app.applicantId === user.id || app.job.employerId === user.id;
  if (!allowed) return new Response("Forbidden", { status: 403 });

  let file: Buffer;
  try {
    file = await readResume(app.resumePath);
  } catch {
    return new Response(isDemoMode ? DEMO_MISSING : "File missing", { status: 404 });
  }

  // Mark as "under review" the first time the employer opens it
  if (app.job.employerId === user.id && app.status === "SUBMITTED") {
    await prisma.application.update({ where: { id }, data: { status: "REVIEWING" } });
  }

  const download = req.nextUrl.searchParams.get("download") === "1";
  const disposition = `${download ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(app.resumeName)}`;

  return new Response(new Uint8Array(file), {
    headers: {
      "Content-Type": app.resumeMime,
      "Content-Length": String(file.length),
      "Content-Disposition": disposition,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
}
