import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "JobPortal — Find your next role",
  description: "Employers post vacancies, applicants search and apply with their resume.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main className="container main">{children}</main>
        <footer className="footer">
          <div className="container muted small">© {new Date().getFullYear()} JobPortal · Built with Next.js & Prisma</div>
        </footer>
      </body>
    </html>
  );
}
