"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Header from "./Header";

interface AdminShellProps {
  shopSlug: string;
  children: React.ReactNode;
}

export default function AdminShell({ shopSlug, children }: AdminShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Extract section slug from pathname: /dashboard/[shop]/[section]/...
  const section = pathname.split("/")[3] ?? "";

  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: "var(--font-body)" }}>
      <Sidebar
        shopSlug={shopSlug}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header
          section={section}
          onMenuToggle={() => setMobileOpen((v) => !v)}
        />
        <main
          className="flex-1 overflow-y-auto"
          style={{ background: "oklch(97% 0.004 250)" }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
