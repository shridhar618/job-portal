import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import LoginForm from "./LoginForm";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "EMPLOYER" ? "/employer" : "/jobs");
  const { next } = await searchParams;

  return (
    <div className="auth-wrap">
      <h1>Welcome back</h1>
      <p className="muted center">Log in to manage vacancies or track your applications.</p>
      <LoginForm next={next ?? ""} />
      <p className="center small" style={{ marginTop: 16 }}>
        New here? <Link href={`/register${next ? `?next=${encodeURIComponent(next)}` : ""}`}>Create an account</Link>
      </p>
      <div className="card demo-box muted">
        <strong>Demo accounts</strong> (after running the seed, password <code>password123</code>):
        <br />Employer: <code>hr@acme.com</code>
        <br />Applicant: <code>applicant@example.com</code>
      </div>
    </div>
  );
}
