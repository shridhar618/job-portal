import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import { isDemoMode } from "@/lib/prisma";
import "./globals.css";

export const metadata: Metadata = {
  title: "JobPortal — Find your next role",
  description: "Employers post vacancies, applicants search and apply with their resume.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {isDemoMode && (
          <div className="demo-banner" role="note">
            <strong>Demo mode:</strong> data is temporary and may reset at any time. Try{" "}
            <code>applicant@example.com</code> or <code>hr@acme.com</code> (password <code>password123</code>).
          </div>
        )}
        <Navbar />
        <main className="container main">{children}</main>
        <footer className="footer">
          <div className="container muted small">© {new Date().getFullYear()} JobPortal · Built with Next.js & Prisma</div>
        </footer>
      </body>
    </html>
  );
}
