"use client";

import { Menu, ShieldCheck } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import GlobalSearch from "./GlobalSearch";
import NotificationsBell from "./NotificationsBell";

const PAGE_LABELS: Record<string, string> = {
  "":         "Pulpit",
  orders:     "Zamówienia",
  customers:  "Klienci",
  stats:      "Analityka",
  products:   "Produkty",
  categories: "Kategorie",
  payments:   "Płatności i VAT",
  delivery:   "Dostawa",
  discounts:  "Kody rabatowe",
  newsletter: "Newsletter",
  branding:   "Logo i kolorystyka",
  home:       "Strona główna",
  about:      "O nas",
  faq:        "FAQ",
  menu:       "Menu nawigacji",
  legal:      "Dokumenty prawne",
  settings:   "Ustawienia panelu",
};

interface HeaderProps {
  shopSlug: string;
  section: string;
  /** Set for Sellflow staff only: URL of the operator panel. */
  adminHref?: string | null;
  onMenuToggle: () => void;
}

export default function Header({ shopSlug, section, adminHref = null, onMenuToggle }: HeaderProps) {
  return (
    <header
      className="h-14 flex items-center gap-4 px-4 sm:px-6 shrink-0"
      style={{ background: "var(--panel-surface)", borderBottom: "1px solid var(--panel-border)" }}
    >
      <button
        onClick={onMenuToggle}
        className="lg:hidden"
        style={{ color: "var(--panel-ink-muted)" }}
      >
        <Menu className="w-5 h-5" strokeWidth={1.5} />
      </button>

      <h2
        className="text-sm font-semibold hidden sm:block"
        style={{ color: "var(--panel-ink)", fontFamily: "var(--font-display)" }}
      >
        {PAGE_LABELS[section] ?? "Panel administracyjny"}
      </h2>

      <div className="flex-1 flex justify-end sm:justify-center">
        <GlobalSearch shopSlug={shopSlug} />
      </div>

      {adminHref && (
        <a
          href={adminHref}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors hover:opacity-90"
          style={{
            background: "oklch(22% 0.24 270)",
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
