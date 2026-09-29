"use client";

import { Menu, ShieldCheck } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import GlobalSearch from "./GlobalSearch";
import NotificationsBell from "./NotificationsBell";
import { findNavItem } from "./nav";

interface HeaderProps {
  shopSlug: string;
  section: string;
  /** Set for Sellflow staff only: URL of the operator panel. */
  adminHref?: string | null;
  onMenuToggle: () => void;
}

export default function Header({ shopSlug, section, adminHref = null, onMenuToggle }: HeaderProps) {
  const page = findNavItem(section);
  return (
    <header
      className="h-14 flex items-center gap-4 px-4 sm:px-6 shrink-0"
      style={{ background: "var(--panel-surface)", borderBottom: "1px solid var(--panel-border)" }}
    >
      <button
        onClick={onMenuToggle}
        aria-label="Otwórz menu"
        className="lg:hidden"
        style={{ color: "var(--panel-ink-muted)" }}
      >
        <Menu className="w-5 h-5" strokeWidth={1.5} />
      </button>

      {/* Okruszki: grupa z menu / strona. Szczegóły (np. /orders/[id]) nadal
          pokazują stronę nadrzędną, bo tytuł rekordu jest już w treści. */}
      <nav aria-label="Ścieżka" className="hidden sm:flex items-center gap-2 text-[13.5px] min-w-0">
        {page ? (
          <>
            {page.section.title && (
              <>
                <span className="text-[var(--panel-ink-muted)] whitespace-nowrap">{page.section.title}</span>
                <span aria-hidden className="text-[var(--panel-ink-faint)]">/</span>
              </>
            )}
            <span className="font-semibold text-[var(--panel-ink)] truncate">{page.item.label}</span>
          </>
        ) : (
          <span className="font-semibold text-[var(--panel-ink)]">Panel administracyjny</span>
        )}
      </nav>

      <div className="flex-1 flex justify-end sm:justify-center">
        <GlobalSearch shopSlug={shopSlug} />
      </div>

      {adminHref && (
        <a
          href={adminHref}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors hover:opacity-90"
          style={{
            background: "var(--panel-sidebar)",
            color: "#fff",
            fontFamily: "var(--font-mono)",
          }}
          title="Przejdź do panelu operatora Sellflow"
        >
          <ShieldCheck className="w-3.5 h-3.5" strokeWidth={2} />
          <span className="hidden sm:inline">Panel admina</span>
        </a>
      )}

      <NotificationsBell shopSlug={shopSlug} />

      <UserButton />
    </header>
  );
}
