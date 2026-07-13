"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Header from "./Header";
import ThemeProvider from "./ThemeProvider";

interface AdminShellProps {
  shopSlug: string;
  children: React.ReactNode;
  /** Non-null only for Sellflow staff: URL of the operator panel to switch to. */
  adminHref?: string | null;
}

export default function AdminShell({ shopSlug, children, adminHref = null }: AdminShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Extract section slug from pathname: /dashboard/[shop]/[section]/...
  const section = pathname.split("/")[3] ?? "";

  return (
    <ThemeProvider>
      <div className="flex h-screen overflow-hidden" style={{ fontFamily: "var(--font-body)" }}>
        <Sidebar
          shopSlug={shopSlug}
          mobileOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
        />

        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <Header
            shopSlug={shopSlug}
            section={section}
            adminHref={adminHref}
            onMenuToggle={() => setMobileOpen((v) => !v)}
          />
          <main
            className="flex-1 overflow-y-auto"
            style={{ background: "var(--panel-bg)" }}
          >
            {children}
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}
