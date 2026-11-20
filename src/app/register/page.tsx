import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import RegisterForm from "./RegisterForm";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ role?: string; next?: string }> }) {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "EMPLOYER" ? "/employer" : "/jobs");
  const { role, next } = await searchParams;

  return (
    <div className="auth-wrap">
      <h1>Create your account</h1>
      <p className="muted center">Hire great people or find your next role.</p>
      <RegisterForm defaultRole={role === "EMPLOYER" ? "EMPLOYER" : "APPLICANT"} next={next ?? ""} />
      <p className="center small" style={{ marginTop: 16 }}>
        Already have an account? <Link href="/login">Log in</Link>
      </p>
    </div>
  );
}
