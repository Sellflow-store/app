"use client";

import { useState } from "react";
import { Users, Search } from "lucide-react";

export interface CustomerRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  totalOrders: number;
  totalSpent: string;
  createdAt: string;
}

const pln = (v: string) => `${(parseFloat(v) || 0).toFixed(2).replace(".", ",")} zł`;

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
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1
            className="text-xl font-bold"
            style={{ fontFamily: "var(--font-display)", color: "var(--panel-ink)" }}
          >
            Klienci
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--panel-ink-muted)" }}>
            {customers.length === 1 ? "1 klient" : `${customers.length} klientów`} — dodają się
            automatycznie przy zamówieniach
          </p>
        </div>

        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
            style={{ color: "var(--panel-ink-faint)" }}
            strokeWidth={1.5}
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Szukaj po imieniu lub e-mailu"
            className="text-xs rounded-full py-2 pl-8 pr-4 outline-none transition-colors"
            style={{
              border: "1.5px solid var(--panel-border)",
              background: "var(--panel-surface)",
              color: "var(--panel-ink)",
              width: "16rem",
            }}
            onFocus={(e) => (e.target.style.borderColor = "var(--panel-primary)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--panel-border)")}
          />
        </div>
      </div>

      {/* Table card */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: "1px solid var(--panel-border)", background: "var(--panel-surface)" }}
      >
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Users className="w-10 h-10" style={{ color: "var(--panel-border-strong)" }} strokeWidth={1} />
            <p className="text-sm" style={{ color: "var(--panel-ink-muted)" }}>
              {q ? "Brak klientów pasujących do wyszukiwania" : "Jeszcze brak klientów — pojawią się po pierwszym zamówieniu"}
            </p>
          </div>
        ) : (
          <>
            <div
              className="grid text-[11px] font-semibold tracking-wide uppercase px-5 py-3"
              style={{
                gridTemplateColumns: "1.8fr 1fr 0.8fr 1fr 1fr",
                color: "var(--panel-ink-muted)",
                borderBottom: "1px solid var(--panel-border)",
                background: "var(--panel-surface-2)",
              }}
            >
              <span>Klient</span>
              <span>Telefon</span>
              <span>Zamówienia</span>
              <span>Wydane łącznie</span>
              <span>Pierwszy zakup</span>
            </div>

            {visible.map((c, i) => (
              <div
                key={c.id}
                className="grid items-center px-5 py-3.5"
                style={{
                  gridTemplateColumns: "1.8fr 1fr 0.8fr 1fr 1fr",
                  borderBottom: i < visible.length - 1 ? "1px solid var(--panel-surface-hover)" : "none",
                }}
              >
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate" style={{ color: "var(--panel-ink)" }}>
                    {c.name}
                  </p>
                  <p className="text-[11px] truncate" style={{ color: "var(--panel-ink-muted)" }}>
                    {c.email}
                  </p>
                </div>
                <span className="text-xs" style={{ color: "var(--panel-ink)" }}>
                  {c.phone ?? "—"}
                </span>
                <span className="text-xs tabular-nums" style={{ color: "var(--panel-ink)" }}>
                  {c.totalOrders}
                </span>
                <span className="text-xs font-semibold tabular-nums" style={{ color: "var(--panel-ink)" }}>
                  {pln(c.totalSpent)}
                </span>
                <span className="text-xs" style={{ color: "var(--panel-ink-muted)" }}>
                  {c.createdAt}
                </span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
