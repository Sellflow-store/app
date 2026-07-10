import { redirect } from "next/navigation";
import Link from "next/link";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { LayoutGrid, Store, LogOut } from "lucide-react";

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

  return (
    <div
      className="min-h-screen grid"
      style={{
        gridTemplateColumns: "240px 1fr",
        background: "var(--brand-paper)",
        fontFamily: "var(--font-body)",
        color: "var(--brand-ink)",
      }}
    >
      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside
        className="flex flex-col"
        style={{
          background: "var(--brand-paper-3)",
          borderRight: "1px solid var(--brand-rule)",
        }}
      >
        <div className="px-6 py-5 flex items-center gap-2.5">
          <svg viewBox="0 0 100 100" className="w-7 h-7 shrink-0" aria-hidden="true">
            <rect width="100" height="100" rx="18" ry="18" fill="oklch(22% 0.24 270)" />
            <text x="50" y="76" fontFamily="Arial Black,Arial,sans-serif" fontWeight="900"
                  fontSize="74" textAnchor="middle" fill="#fff">S</text>
          </svg>
          <div>
            <div
              className="text-sm font-bold tracking-tight leading-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Sellflow
            </div>
            <div
              className="text-[10px] font-semibold uppercase tracking-[0.18em] leading-tight"
              style={{ color: "var(--brand-ink-2)", fontFamily: "var(--font-mono)" }}
            >
              Ops
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-1">
          <NavLink href="/ops" icon={<LayoutGrid className="w-4 h-4" strokeWidth={1.75} />}>
            Przegląd
          </NavLink>
          <NavLink href="/ops/shops" icon={<Store className="w-4 h-4" strokeWidth={1.75} />}>
            Sklepy
          </NavLink>
        </nav>

        <div
          className="px-4 py-4"
          style={{ borderTop: "1px solid var(--brand-rule)" }}
        >
          <div className="text-xs font-medium" style={{ color: "var(--brand-ink)" }}>
            {displayName}
          </div>
          <div className="text-[11px] mt-0.5" style={{ color: "var(--brand-ink-2)" }}>
            {user.email}
          </div>
          <Link
            href="/login?logout=1"
            className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-medium hover:underline"
            style={{ color: "var(--brand-ink-2)", fontFamily: "var(--font-mono)" }}
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

function NavLink({
  href, icon, children,
}: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
      style={{ color: "var(--brand-ink)" }}
    >
      <span style={{ color: "var(--brand-ink-2)" }}>{icon}</span>
      {children}
    </Link>
  );
}
