"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Package } from "lucide-react";

export const STATUS_STYLES: Record<string, { label: string; bg: string; color: string; dot: string }> = {
  pending:    { label: "Nowe",         bg: "oklch(95% 0.08 260)", color: "oklch(35% 0.20 260)", dot: "var(--panel-accent)" },
  processing: { label: "W realizacji", bg: "oklch(95% 0.09 85)",  color: "oklch(40% 0.14 75)",  dot: "var(--panel-warning)" },
  shipped:    { label: "Wysłane",      bg: "oklch(94% 0.10 195)", color: "oklch(35% 0.18 195)", dot: "var(--panel-aqua)" },
  delivered:  { label: "Dostarczone",  bg: "oklch(93% 0.08 145)", color: "oklch(30% 0.16 145)", dot: "var(--panel-success)" },
  cancelled:  { label: "Anulowane",    bg: "oklch(95% 0.05 20)",  color: "oklch(40% 0.18 20)",  dot: "var(--panel-ink-faint)" },
};

export const PAYMENT_LABELS: Record<string, string> = {
  transfer: "przelew",
  cod: "pobranie",
  online: "online (Tpay)",
};

export interface OrderRow {
  id: string;
  orderNumber: string;
  customer: string;
  email: string;
  total: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  date: string;
}

const FILTERS: { label: string; value: string | null }[] = [
  { label: "Wszystkie", value: null },
  { label: "Nowe", value: "pending" },
  { label: "W realizacji", value: "processing" },
  { label: "Wysłane", value: "shipped" },
  { label: "Dostarczone", value: "delivered" },
  { label: "Anulowane", value: "cancelled" },
];

// Kolumny tabeli — jedna definicja dla nagłówka i wierszy.
const COLS = "grid-cols-[112px_minmax(0,1.6fr)_minmax(0,1fr)_132px_120px_96px]";

// Grupowanie tysięcy zawsze ("1 120,00 zł"): polska norma domyślnie pomija
// separator w liczbach czterocyfrowych, a w kolumnie kwot to utrudnia czytanie.
const PLN = new Intl.NumberFormat("pl-PL", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  useGrouping: "always",
});

function formatPln(price: string): string {
  const n = parseFloat(price);
  if (isNaN(n)) return price;
  return `${PLN.format(n)} zł`;
}

interface Props {
  shopSlug: string;
  orders: OrderRow[];
}

export default function OrdersTable({ shopSlug, orders }: Props) {
  const [filter, setFilter] = useState<string | null>(null);
  const visible = filter ? orders.filter((o) => o.status === filter) : orders;
  const countFor = (value: string | null) =>
    value ? orders.filter((o) => o.status === value).length : orders.length;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-6xl mx-auto">
      {/* Page header */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
        <div>
          <h1 className="text-xl font-semibold text-[var(--panel-ink)]" style={{ fontFamily: "var(--font-display)" }}>
            Zamówienia
          </h1>
          <p className="text-[13px] mt-0.5 text-[var(--panel-ink-muted)]">
            {orders.length === 1 ? "1 zamówienie" : `${orders.length} zamówień`} łącznie
          </p>
        </div>
      </div>

      {/* Status filters with counts */}
      <div role="tablist" aria-label="Filtr statusu" className="flex flex-wrap gap-1.5 mb-4">
        {FILTERS.map((f) => {
          const on = filter === f.value;
          return (
            <button
              key={f.label}
              role="tab"
              aria-selected={on}
              onClick={() => setFilter(f.value)}
              className={[
                "h-8 px-3 rounded-md text-[13px] font-medium flex items-center gap-2 transition-colors border",
                on
                  ? "bg-[var(--panel-primary)] border-[var(--panel-primary)] text-[var(--panel-surface)]"
                  : "bg-[var(--panel-surface)] border-[var(--panel-border)] text-[var(--panel-ink-muted)] hover:border-[var(--panel-border-strong)] hover:text-[var(--panel-ink)]",
              ].join(" ")}
            >
              {f.label}
              <span className={["text-[11.5px] tabular-nums", on ? "opacity-80" : "text-[var(--panel-ink-faint)]"].join(" ")}>
                {countFor(f.value)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden border border-[var(--panel-border)] bg-[var(--panel-surface)]">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Package className="w-10 h-10 text-[var(--panel-ink-faint)]" strokeWidth={1} />
            <p className="text-sm text-[var(--panel-ink-muted)]">
              {filter ? "Brak zamówień o tym statusie" : "Brak zamówień. Pojawią się tu po pierwszym zakupie."}
            </p>
          </div>
        ) : (
          <>
          {/* Telefon: karty zamiast tabeli — 6 kolumn nie zmieści się w 390 px. */}
          <ul className="md:hidden divide-y divide-[var(--panel-border)]">
            {visible.map((order) => {
              const st = STATUS_STYLES[order.status] ?? STATUS_STYLES.pending;
              const paid = order.paymentStatus === "paid";
              return (
                <li key={order.id}>
                  <Link
                    href={`/dashboard/${shopSlug}/orders/${order.id}`}
                    className="flex flex-col gap-1.5 px-4 py-3.5 transition-colors hover:bg-[var(--panel-surface-hover)]"
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span className="text-[12.5px] font-medium text-[var(--panel-primary)]" style={{ fontFamily: "var(--font-mono)" }}>
                        {order.orderNumber}
                      </span>
                      <span className="font-semibold tabular-nums text-[var(--panel-ink)]">{formatPln(order.total)}</span>
                    </span>
                    <span className="font-medium text-[14px] text-[var(--panel-ink)] truncate">{order.customer}</span>
                    <span className="flex items-center gap-3 text-[12.5px] text-[var(--panel-ink-muted)]">
                      <span className="flex items-center gap-1.5">
                        <span aria-hidden className="w-2 h-2 rounded-full" style={{ background: st.dot }} />
                        {st.label}
                      </span>
                      <span>{paid ? "opłacone" : "czeka na płatność"}</span>
                      <span className="ml-auto">{order.date}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <div role="table" aria-label="Zamówienia" className="hidden md:block overflow-x-auto">
            <div
              role="row"
              className={`grid ${COLS} gap-4 items-center px-5 h-9 min-w-[760px] text-[12px] font-medium text-[var(--panel-ink-muted)] border-b border-[var(--panel-border)] bg-[var(--panel-surface-2)]`}
            >
              <span role="columnheader">Numer</span>
              <span role="columnheader">Klientka / klient</span>
              <span role="columnheader">Płatność</span>
              <span role="columnheader">Status</span>
              <span role="columnheader" className="text-right">Kwota</span>
              <span role="columnheader" className="text-right">Data</span>
            </div>

            {visible.map((order) => {
              const st = STATUS_STYLES[order.status] ?? STATUS_STYLES.pending;
              const paid = order.paymentStatus === "paid";
              return (
                <Link
                  key={order.id}
                  role="row"
                  href={`/dashboard/${shopSlug}/orders/${order.id}`}
                  className={`group grid ${COLS} gap-4 items-center px-5 h-[52px] min-w-[760px] text-[13.5px] border-b last:border-b-0 border-[var(--panel-border)] transition-colors hover:bg-[var(--panel-surface-hover)]`}
                >
                  <span className="text-[12.5px] text-[var(--panel-primary)] font-medium" style={{ fontFamily: "var(--font-mono)" }}>
                    {order.orderNumber}
                  </span>

                  <span className="flex items-baseline gap-2.5 min-w-0">
                    <span className="font-medium text-[var(--panel-ink)] truncate shrink-0 max-w-[60%]">{order.customer}</span>
                    <span className="text-[12.5px] text-[var(--panel-ink-faint)] truncate">{order.email}</span>
                  </span>

                  <span className="flex items-center gap-2 min-w-0 text-[13px] text-[var(--panel-ink-muted)]">
                    <span
                      aria-hidden
                      className="w-2 h-2 rounded-[2px] shrink-0"
                      style={paid ? { background: "var(--panel-success)" } : { border: "1.5px solid var(--panel-warning)" }}
                    />
                    <span className="truncate">
                      {paid ? "opłacone" : "czeka"}
                      {order.paymentMethod ? ` · ${PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}` : ""}
                    </span>
                  </span>

                  <span className="flex items-center gap-2 text-[var(--panel-ink)]">
                    <span aria-hidden className="w-2 h-2 rounded-full shrink-0" style={{ background: st.dot }} />
                    {st.label}
                  </span>

                  <span className="text-right font-semibold tabular-nums text-[var(--panel-ink)]">
                    {formatPln(order.total)}
                  </span>

                  <span className="flex items-center justify-end gap-2 text-[12.5px] text-[var(--panel-ink-muted)]">
                    {order.date}
                    <ChevronRight className="w-3.5 h-3.5 text-[var(--panel-ink-faint)] opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={2} />
                  </span>
                </Link>
              );
            })}
          </div>
          </>
        )}
      </div>
    </div>
  );
}
