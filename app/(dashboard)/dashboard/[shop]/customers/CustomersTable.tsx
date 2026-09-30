"use client";

import { useState } from "react";
import { Users, Search } from "lucide-react";
import { formatPln } from "@/lib/money";

export interface CustomerRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  totalOrders: number;
  totalSpent: string;
  createdAt: string;
}

const pln = (v: string) => formatPln(parseFloat(v) || 0);

const COLS = "grid-cols-[minmax(0,1.8fr)_150px_110px_140px_130px]";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

interface Props {
  customers: CustomerRow[];
}

export default function CustomersTable({ customers }: Props) {
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const visible = q
    ? customers.filter(
        (c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
      )
    : customers;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
        <div>
          <h1 className="text-xl font-semibold text-[var(--panel-ink)]" style={{ fontFamily: "var(--font-display)" }}>
            Klienci
          </h1>
          <p className="text-[13px] mt-0.5 text-[var(--panel-ink-muted)]">
            {customers.length === 1 ? "1 klient" : `${customers.length} klientów`}. Dodają się automatycznie przy zamówieniach.
          </p>
        </div>

        <label className="flex items-center gap-2 h-9 w-full sm:w-72 px-3 rounded-lg border border-[var(--panel-border)] bg-[var(--panel-surface)] focus-within:border-[var(--panel-primary)] transition-colors">
          <Search className="w-4 h-4 text-[var(--panel-ink-faint)]" strokeWidth={1.75} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Szukaj po imieniu lub e-mailu"
            aria-label="Szukaj klientów"
            className="flex-1 bg-transparent outline-none text-[13.5px] text-[var(--panel-ink)] placeholder:text-[var(--panel-ink-faint)]"
          />
        </label>
      </div>

      <div className="rounded-xl overflow-hidden border border-[var(--panel-border)] bg-[var(--panel-surface)]">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Users className="w-10 h-10 text-[var(--panel-ink-faint)]" strokeWidth={1} />
            <p className="text-sm text-[var(--panel-ink-muted)]">
              {q ? "Brak klientów pasujących do wyszukiwania." : "Jeszcze brak klientów. Pojawią się po pierwszym zamówieniu."}
            </p>
          </div>
        ) : (
          <>
            <ul className="md:hidden divide-y divide-[var(--panel-border)]">
              {visible.map((c) => (
                <li key={c.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-[12px] font-semibold bg-[var(--panel-primary-soft)] text-[var(--panel-primary)]">
                    {initials(c.name)}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[14px] font-medium truncate text-[var(--panel-ink)]">{c.name}</span>
                    <span className="block text-[12.5px] truncate text-[var(--panel-ink-muted)]">
                      {c.totalOrders} zam. · {pln(c.totalSpent)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>

            <div role="table" aria-label="Klienci" className="hidden md:block">
              <div
                role="row"
                className={`grid ${COLS} gap-4 items-center px-5 h-9 text-[12px] font-medium text-[var(--panel-ink-muted)] border-b border-[var(--panel-border)] bg-[var(--panel-surface-2)]`}
              >
                <span role="columnheader">Klient</span>
                <span role="columnheader">Telefon</span>
                <span role="columnheader" className="text-right">Zamówienia</span>
                <span role="columnheader" className="text-right">Wydane łącznie</span>
                <span role="columnheader" className="text-right">Pierwszy zakup</span>
              </div>

              {visible.map((c) => (
                <div
                  key={c.id}
                  role="row"
                  className={`grid ${COLS} gap-4 items-center px-5 h-[56px] text-[13.5px] border-b last:border-b-0 border-[var(--panel-border)] transition-colors hover:bg-[var(--panel-surface-hover)]`}
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <span className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[11.5px] font-semibold bg-[var(--panel-primary-soft)] text-[var(--panel-primary)]">
                      {initials(c.name)}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-medium truncate text-[var(--panel-ink)]">{c.name}</span>
                      <a href={`mailto:${c.email}`} className="block text-[12.5px] truncate text-[var(--panel-ink-muted)] hover:text-[var(--panel-primary)] hover:underline">
                        {c.email}
                      </a>
                    </span>
                  </span>
                  <span className="text-[var(--panel-ink)] tabular-nums">
                    {c.phone ? <a href={`tel:${c.phone}`} className="hover:underline">{c.phone}</a> : <span className="text-[var(--panel-ink-faint)]">—</span>}
                  </span>
                  <span className="text-right tabular-nums text-[var(--panel-ink)]">{c.totalOrders}</span>
                  <span className="text-right font-semibold tabular-nums text-[var(--panel-ink)]">{pln(c.totalSpent)}</span>
                  <span className="text-right text-[12.5px] text-[var(--panel-ink-muted)]">{c.createdAt}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
