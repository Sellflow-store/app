"use client";

import { Menu } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import GlobalSearch from "./GlobalSearch";
import NotificationsBell from "./NotificationsBell";

const PAGE_LABELS: Record<string, string> = {
  "":         "Pulpit",
  orders:     "Zamówienia",
  customers:  "Klienci",
  stats:      "Statystyki",
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
  onMenuToggle: () => void;
}

export default function Header({ shopSlug, section, onMenuToggle }: HeaderProps) {
  return (
    <header
      className="h-14 flex items-center gap-4 px-4 sm:px-6 shrink-0"
      style={{ background: "#fff", borderBottom: "1px solid oklch(92% 0 0)" }}
    >
      <button
        onClick={onMenuToggle}
        className="lg:hidden"
        style={{ color: "oklch(55% 0 0)" }}
      >
        <Menu className="w-5 h-5" strokeWidth={1.5} />
      </button>

      <h2
        className="text-sm font-semibold hidden sm:block"
        style={{ color: "oklch(10% 0 0)", fontFamily: "var(--font-display)" }}
      >
        {PAGE_LABELS[section] ?? "Panel administracyjny"}
      </h2>

      <div className="flex-1 flex justify-end sm:justify-center">
        <GlobalSearch shopSlug={shopSlug} />
      </div>

      <NotificationsBell shopSlug={shopSlug} />

      <UserButton />
    </header>
  );
}
