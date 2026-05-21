"use client";

import { useState } from "react";
import { Menu, Search, Bell } from "lucide-react";
import { UserButton } from "@clerk/nextjs";

const PAGE_LABELS: Record<string, string> = {
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
  section: string;
  onMenuToggle: () => void;
}

export default function Header({ section, onMenuToggle }: HeaderProps) {
  const [search, setSearch] = useState("");

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
        <div className="relative w-full max-w-sm">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
            strokeWidth={1.5}
            style={{ color: "oklch(55% 0 0)" }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Szukaj stron, produktów, treści…"
            className="w-full pl-9 pr-4 py-2 rounded-lg text-xs focus:outline-none transition-colors"
            style={{
              border: "1px solid oklch(88% 0 0)",
              background: "oklch(97% 0 0)",
              color: "oklch(10% 0 0)",
              fontFamily: "var(--font-body)",
            }}
            onFocus={(e) => (e.target.style.borderColor = "oklch(55% 0 0)")}
            onBlur={(e) => (e.target.style.borderColor = "oklch(88% 0 0)")}
          />
        </div>
      </div>

      <button className="relative" style={{ color: "oklch(55% 0 0)" }}>
        <Bell className="w-4 h-4" strokeWidth={1.5} />
        <span
          className="absolute -top-1 -right-1 w-2 h-2 rounded-full"
          style={{ background: "oklch(56% 0.30 335)" }}
        />
      </button>

      <UserButton />
    </header>
  );
}
