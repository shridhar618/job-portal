export type Role = "EMPLOYER" | "APPLICANT";

export const JOB_TYPES = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  CONTRACT: "Contract",
  INTERNSHIP: "Internship",
} as const;

export const WORK_MODES = {
  ONSITE: "On-site",
  REMOTE: "Remote",
  HYBRID: "Hybrid",
} as const;

export const EXPERIENCE_LEVELS = {
  ENTRY: "Entry level",
  MID: "Mid level",
  SENIOR: "Senior",
} as const;

export const JOB_STATUSES = {
  OPEN: "Open",
  CLOSED: "Closed",
} as const;

export const APPLICATION_STATUSES = {
  SUBMITTED: "Submitted",
  REVIEWING: "Under review",
  SHORTLISTED: "Shortlisted",
  REJECTED: "Rejected",
  HIRED: "Hired",
} as const;

export type ApplicationStatus = keyof typeof APPLICATION_STATUSES;

export function label<T extends Record<string, string>>(map: T, key: string): string {
  return (map as Record<string, string>)[key] ?? key;
}

export function isKeyOf<T extends Record<string, string>>(map: T, key: unknown): key is keyof T & string {
  return typeof key === "string" && Object.prototype.hasOwnProperty.call(map, key);
}

export const MAX_RESUME_BYTES = 5 * 1024 * 1024; // 5 MB
export const PAGE_SIZE = 10;
