# JobPortal — Next.js Job Portal

A full-stack job portal built with **Next.js 15 (App Router)**, **Prisma** and **SQLite**.

- **Employers** post, edit, close/reopen and delete vacancies, review applicants, open/download resumes and move applications through a hiring pipeline.
- **Applicants** search and filter jobs, apply with a resume upload (PDF/DOC/DOCX), and track or withdraw their applications.
- Jobs, users and applications are stored in a database; resumes are stored on disk outside `public/` and served only to authorised users.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 App Router, React 19, TypeScript |
| Mutations | Server Actions (`useActionState`) |
| Database | SQLite via Prisma ORM (switchable to PostgreSQL/MySQL) |
| Auth | Email + password (bcrypt), signed JWT session cookie (`jose`), role-based access |
| File upload | Server Action → `uploads/resumes/`, type + magic-byte validation, 5 MB limit |
| Styling | Plain CSS (`src/app/globals.css`), responsive |

## Getting started

Requires **Node.js 20+** (Node 22 LTS recommended).

```bash
npm install                 # also runs `prisma generate`
cp .env.example .env        # on Windows: copy .env.example .env
npm run setup               # creates the SQLite DB + seeds demo data
npm run dev                 # http://localhost:3000
```

### Demo accounts (password `password123`)

| Role | Email |
|---|---|
| Employer (Acme Technologies) | `hr@acme.com` |
| Employer (Nimbus Cloud) | `talent@nimbus.io` |
| Applicant | `applicant@example.com` |

## Features

### Applicants
- Keyword search across title, description, skills and company
- Filters: location, job type, work mode, experience, minimum salary; sort by newest/oldest/salary; pagination
- Job detail page with salary, deadline, skills and applicant count
- Apply with resume (required), phone and cover letter — one application per job
- **My applications**: status tracking (Submitted → Under review → Shortlisted → Hired / Rejected), withdraw while still pending

### Employers
- Dashboard with stats (total/open jobs, applications, unreviewed)
- Create / edit jobs with validation, optional application deadline
- Close / reopen / delete (deleting removes applications and resume files)
- Applicant list per job: filter by status, search, view/download resume, update status
- Opening a resume automatically moves the application to *Under review*

### Security
- Passwords hashed with bcrypt; httpOnly, SameSite=Lax session cookie
- Every server action and page checks the user's role and ownership
- Resumes validated by extension **and** file signature, renamed to random UUIDs, stored outside `public/`, and served by `/api/resumes/[id]` only to the applicant or the job's employer
- Expired / closed jobs stop accepting applications server-side

## Project structure

```
prisma/
  schema.prisma           # User, Job, Application models
  seed.mjs                # demo users + jobs
src/
  app/
    page.tsx              # home: hero search, stats, latest jobs
    jobs/page.tsx         # search + filters + pagination
    jobs/[id]/            # job detail + ApplyForm (resume upload)
    applications/         # applicant: my applications
    employer/             # employer dashboard
    employer/jobs/new     # post a job
    employer/jobs/[id]/edit
    employer/jobs/[id]/applications
    login/ register/      # auth pages
    actions/              # server actions: auth, jobs, applications
    api/resumes/[id]/     # authorised resume download
  components/             # Navbar, JobCard, JobForm, SubmitButton, StatusBadge
  lib/                    # prisma client, auth/session, uploads, constants, formatters
uploads/resumes/          # stored resumes (git-ignored)
```

## Database schema

- **User** — `id, name, email (unique), passwordHash, role (EMPLOYER | APPLICANT), company`
- **Job** — `id, title, description, location, jobType, workMode, experience, salaryMin, salaryMax, skills, status (OPEN | CLOSED), deadline, employerId → User`
- **Application** — `id, jobId → Job, applicantId → User, phone, coverLetter, resumePath, resumeName, resumeMime, resumeSize, status`, unique on `(jobId, applicantId)`

Browse the data with `npm run db:studio`.

## Switching to PostgreSQL

1. In `prisma/schema.prisma` set `provider = "postgresql"`.
2. Set `DATABASE_URL="postgresql://user:pass@localhost:5432/jobportal"` in `.env`.
3. For case-insensitive search, add `mode: "insensitive"` to the `contains` filters in `src/app/jobs/page.tsx`.
4. Run `npm run setup`.

## Deployment note

Resumes are written to the local `uploads/` folder, which works on a VPS or your own machine. On serverless hosts (e.g. Vercel) the filesystem is not persistent — swap `src/lib/uploads.ts` for object storage such as S3, Cloudinary or Vercel Blob, and use a hosted database.
