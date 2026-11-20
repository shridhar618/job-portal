import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { logout } from "@/app/actions/auth";

export default async function Navbar() {
  const user = await getCurrentUser();

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link href="/" className="brand">
          <span className="brand-mark">J</span> JobPortal
        </Link>
        <nav className="nav-links">
          <Link href="/jobs">Browse jobs</Link>
          {user?.role === "EMPLOYER" && (
            <>
              <Link href="/employer">Dashboard</Link>
              <Link href="/employer/jobs/new" className="btn btn-primary btn-sm">
                Post a job
              </Link>
            </>
          )}
          {user?.role === "APPLICANT" && <Link href="/applications">My applications</Link>}
          {user ? (
            <div className="nav-user">
              <span className="nav-name" title={user.email}>
                {user.name}
                <small>{user.role === "EMPLOYER" ? user.company : "Applicant"}</small>
              </span>
              <form action={logout}>
                <button type="submit" className="btn btn-ghost btn-sm">
                  Log out
                </button>
              </form>
            </div>
          ) : (
            <>
              <Link href="/login">Log in</Link>
              <Link href="/register" className="btn btn-primary btn-sm">
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
