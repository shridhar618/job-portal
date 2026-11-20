import { APPLICATION_STATUSES, JOB_STATUSES, label } from "@/lib/constants";

export function ApplicationStatusBadge({ status }: { status: string }) {
  return <span className={`badge badge-${status.toLowerCase()}`}>{label(APPLICATION_STATUSES, status)}</span>;
}

export function JobStatusBadge({ status }: { status: string }) {
  return <span className={`badge badge-job-${status.toLowerCase()}`}>{label(JOB_STATUSES, status)}</span>;
}
