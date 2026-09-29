import { redirect } from "next/navigation";
import Link from "next/link";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { LogOut, ExternalLink } from "lucide-react";
import OpsNav from "./OpsNav";

/**
 * Defence-in-depth role gate. Middleware already requires a Clerk session
 * for /ops/* but role lookup needs DB, which doesn't belong in edge
 * middleware. Here we run the DB query in a server component and bounce
 * non-admins to "/" silently.
 */
export default async function OpsLayout({ children }: { children: React.ReactNode }) {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/login");

  // Non-admins are bounced to the app platform. Must be an ABSOLUTE app-host
  // URL, not "/": on admin.<domain> the middleware rewrites "/" back to /ops,
  // so a relative redirect here would loop (ERR_TOO_MANY_REDIRECTS).
  const user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) });
  if (!user || user.role !== "admin") {
    redirect(process.env.NEXT_PUBLIC_APP_URL || "/");
  }

  const clerkUser = await currentUser();
  const displayName = [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ")
    || user.email
    || "Admin";

  // Where "Przejdź do sklepu" sends an admin back to the merchant app. On the
  // deployed hosts these are separate subdomains; in local dev it's the root.
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
    || (process.env.NEXT_PUBLIC_APP_DOMAIN
        ? `https://${process.env.NEXT_PUBLIC_APP_SUBDOMAIN || "app"}.${process.env.NEXT_PUBLIC_APP_DOMAIN}`
        : "/");

  return (
    <div
      className="min-h-screen grid"
      style={{
        gridTemplateColumns: "240px 1fr",
        background: "var(--panel-bg)",
        fontFamily: "var(--font-body)",
        color: "var(--panel-ink)",
        // Strony ops czytają tokeny --brand-*; tu mapujemy je na tokeny panelu,
        // żeby ops wyglądał jak panel sklepu bez przepisywania każdego widoku.
        ["--brand-paper" as string]: "var(--panel-surface)",
        ["--brand-paper-2" as string]: "var(--panel-surface-2)",
        ["--brand-paper-3" as string]: "var(--panel-surface-2)",
        ["--brand-rule" as string]: "var(--panel-border)",
        ["--brand-ink" as string]: "var(--panel-ink)",
        ["--brand-ink-2" as string]: "var(--panel-ink-muted)",
        ["--brand-accent" as string]: "var(--panel-accent)",
        ["--brand-on-accent" as string]: "#ffffff",
        ["--brand-success" as string]: "var(--panel-success-strong)",
        ["--brand-aqua-2" as string]: "var(--panel-aqua)",
      }}
    >
      {/* ── Menu: granat jak w panelu sklepu ─────────────────────── */}
      <aside className="flex flex-col h-screen sticky top-0 bg-[var(--panel-sidebar)] text-[var(--panel-sidebar-ink)]">
        <div className="flex items-center gap-2.5 px-5 h-14 shrink-0 border-b border-[var(--panel-sidebar-border)] text-white">
          <span aria-hidden className="w-2.5 h-2.5 rounded-[3px] bg-[var(--panel-aqua)]" />
          <span className="flex flex-col leading-none">
            <span className="text-[15px] font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
              Sellflow
            </span>
            <span className="text-[10.5px] font-medium tracking-[0.08em] uppercase mt-1 text-[var(--panel-sidebar-muted)]">
              ops
            </span>
          </span>
        </div>

        <nav aria-label="Menu ops" className="flex-1 px-3 py-4 space-y-0.5">
          <OpsNav />
          <div className="pt-3 mt-3 border-t border-[var(--panel-sidebar-border)]">
            <a
              href={appUrl}
              className="flex items-center gap-3 px-2.5 h-9 rounded-md text-[13.5px] transition-colors text-[var(--panel-sidebar-ink)] hover:bg-[var(--panel-sidebar-hover)] hover:text-white"
            >
              <ExternalLink className="w-4 h-4 text-[var(--panel-sidebar-muted)]" strokeWidth={1.75} />
              Przejdź do panelu sklepu
            </a>
          </div>
        </nav>

        <div className="px-5 py-4 border-t border-[var(--panel-sidebar-border)]">
          <div className="text-xs font-medium text-white">{displayName}</div>
          <div className="text-[11px] mt-0.5 text-[var(--panel-sidebar-muted)] truncate">{user.email}</div>
          <Link
            href="/login?logout=1"
            className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-medium hover:underline text-[var(--panel-sidebar-muted)] hover:text-white"
          >
            <LogOut className="w-3 h-3" strokeWidth={1.75} />
            Wyloguj
          </Link>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────── */}
      <main className="px-10 py-8 overflow-x-auto">{children}</main>
    </div>
  );
}
