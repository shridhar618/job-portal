import Link from "next/link";

export default function NotFound() {
  return (
    <div className="card empty">
      <h1>Page not found</h1>
      <p className="muted">The job or page you&apos;re looking for doesn&apos;t exist or has been removed.</p>
      <Link href="/jobs" className="btn btn-primary">Browse jobs</Link>
    </div>
  );
}
