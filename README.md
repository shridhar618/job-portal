# JobPortal — Next.js Job Portal

![Next.js](https://img.shields.io/badge/Next.js-000000?logo=nextdotjs&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white) ![Prisma](https://img.shields.io/badge/Prisma-2D3748?logo=prisma&logoColor=white) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white) ![Vercel](https://img.shields.io/badge/Vercel-000000?logo=vercel&logoColor=white)

A full-stack job portal built with **Next.js 15 (App Router)**, **Prisma** and **PostgreSQL**, ready to deploy on **Vercel**.

- **Employers** post, edit, close/reopen and delete vacancies, review applicants, open/download resumes and move applications through a hiring pipeline.
- **Applicants** search and filter jobs, apply with a resume upload (PDF/DOC/DOCX), and track or withdraw their applications.
- Jobs, users and applications are stored in a database; resumes are stored in a private Vercel Blob store (or on disk locally) and served only to authorised users.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 App Router, React 19, TypeScript |
| Mutations | Server Actions (`useActionState`) |
| Database | PostgreSQL via Prisma ORM (Neon / Supabase free tier works) |
| Auth | Email + password (bcrypt), signed JWT session cookie (`jose`), role-based access |
| File upload | Server Action → private Vercel Blob (or `uploads/resumes/` locally), type + magic-byte validation, 4 MB limit |
| Styling | Plain CSS (`src/app/globals.css`), responsive |

## Getting started

Requires **Node.js 20+** (Node 22 LTS recommended).

```bash
npm install                 # also runs `prisma generate`
cp .env.example .env        # on Windows: copy .env.example .env
                            # then paste your Postgres connection strings into .env
npm run setup               # creates the tables + seeds demo data
npm run dev                 # http://localhost:3000
```

### Demo accounts (password `password123`)

| Role | Email |
|---|---|
| Employer (Acme Technologies) | `hr@acme.com` |
| Employer (Nimbus Cloud) | `talent@nimbus.io` |
| Applicant | `applicant@example.com` |

## Environment variables

Copy `.env.example` to `.env`.

| Variable | Purpose | Default |
|---|---|---|
| `DATABASE_URL` | Database connection string | `file:./dev.db` |
| `SESSION_SECRET` | Secret for signing session cookies. Use a long random string | placeholder |

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

## Deploying to Vercel

1. **Create a database.** Make a free Postgres database on [Neon](https://neon.tech) (or Supabase).
   Copy the *pooled* connection string into `DATABASE_URL` and the *direct* one into `DIRECT_URL` in your local `.env`.
2. **Create the tables and demo data** (run once, from your machine):
   ```bash
   npm run setup
   ```
3. **Import the repo in Vercel** (vercel.com → Add New → Project → pick `job-portal`).
4. **Add environment variables** in Project → Settings → Environment Variables:
   `DATABASE_URL`, `DIRECT_URL`, `SESSION_SECRET` (a new long random string).
5. **Add resume storage.** Project → Storage → Create → **Blob**, choose **Private** access, and connect it to the project.
   This sets `BLOB_READ_WRITE_TOKEN` automatically.
6. **Deploy** (or redeploy so the new variables are picked up).

If you change `prisma/schema.prisma` later, run `npm run db:push` again against the same database.

Locally, if `BLOB_READ_WRITE_TOKEN` is not set, resumes are saved to `uploads/resumes/` instead.
