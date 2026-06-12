"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Package } from "lucide-react";

export const STATUS_STYLES: Record<string, { label: string; bg: string; color: string }> = {
  pending:    { label: "Nowe",         bg: "oklch(95% 0.08 260)", color: "oklch(35% 0.20 260)" },
  processing: { label: "W realizacji", bg: "oklch(95% 0.09 85)",  color: "oklch(40% 0.14 75)"  },
  shipped:    { label: "Wysłane",      bg: "oklch(94% 0.10 195)", color: "oklch(35% 0.18 195)" },
  delivered:  { label: "Dostarczone",  bg: "oklch(93% 0.08 145)", color: "oklch(30% 0.16 145)" },
  cancelled:  { label: "Anulowane",    bg: "oklch(95% 0.05 20)",  color: "oklch(40% 0.18 20)"  },
};

export const PAYMENT_LABELS: Record<string, string> = {
  transfer: "przelew",
  cod: "pobranie",
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
];

function formatPln(price: string): string {
  const n = parseFloat(price);
  if (isNaN(n)) return price;
  return `${n.toFixed(2).replace(".", ",")} zł`;
}

interface Props {
  shopSlug: string;
  orders: OrderRow[];
}

export default function OrdersTable({ shopSlug, orders }: Props) {
  const [filter, setFilter] = useState<string | null>(null);
  const visible = filter ? orders.filter((o) => o.status === filter) : orders;

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1
            className="text-xl font-bold"
            style={{ fontFamily: "var(--font-display)", color: "oklch(11% 0.10 275)" }}
          >
            Zamówienia
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "oklch(50% 0 0)" }}>
            {orders.length === 1 ? "1 zamówienie" : `${orders.length} zamówień`} łącznie
          </p>
        </div>

        {/* Status filter tabs */}
        <div className="flex gap-1 p-1 rounded-lg" style={{ background: "oklch(92% 0 0)" }}>
          {FILTERS.map((f) => (
            <button
              key={f.label}
              onClick={() => setFilter(f.value)}
              className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
              style={
                filter === f.value
                  ? { background: "#fff", color: "oklch(11% 0.10 275)", boxShadow: "0 1px 3px oklch(0% 0 0 / 0.08)" }
                  : { color: "oklch(45% 0 0)" }
              }
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table card */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: "1px solid oklch(90% 0 0)", background: "#fff" }}
      >
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Package className="w-10 h-10" style={{ color: "oklch(80% 0 0)" }} strokeWidth={1} />
            <p className="text-sm" style={{ color: "oklch(55% 0 0)" }}>
              {filter ? "Brak zamówień o tym statusie" : "Brak zamówień — pojawią się tu po pierwszym zakupie"}
            </p>
          </div>
        ) : (
          <>
            {/* Header row */}
            <div
              className="grid text-[11px] font-semibold tracking-wide uppercase px-5 py-3"
              style={{
                gridTemplateColumns: "1fr 1.6fr 1fr 1.2fr 1fr",
                color: "oklch(50% 0 0)",
                borderBottom: "1px solid oklch(92% 0 0)",
                background: "oklch(98% 0 0)",
              }}
            >
              <span>Nr zamówienia</span>
              <span>Klient</span>
              <span>Kwota</span>
              <span>Status</span>
              <span>Data</span>
            </div>

            {visible.map((order, i) => {
              const st = STATUS_STYLES[order.status] ?? STATUS_STYLES.pending;
              return (
                <Link
                  key={order.id}
                  href={`/dashboard/${shopSlug}/orders/${order.id}`}
                  className="grid items-center px-5 py-3.5 cursor-pointer transition-colors"
                  style={{
                    gridTemplateColumns: "1fr 1.6fr 1fr 1.2fr 1fr",
                    borderBottom: i < visible.length - 1 ? "1px solid oklch(94% 0 0)" : "none",
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "oklch(98.5% 0.003 250)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "")}
                >
                  <span
                    className="text-xs font-semibold"
                    style={{ color: "oklch(22% 0.24 270)", fontFamily: "var(--font-display)" }}
                  >
                    {order.orderNumber}
                  </span>

                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate" style={{ color: "oklch(15% 0 0)" }}>
                      {order.customer}
                    </p>
                    <p className="text-[11px] truncate" style={{ color: "oklch(55% 0 0)" }}>
                      {order.email}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold" style={{ color: "oklch(11% 0.10 275)" }}>
                      {formatPln(order.total)}
                    </p>
                    <p className="text-[11px]" style={{ color: order.paymentStatus === "paid" ? "oklch(40% 0.16 145)" : "oklch(55% 0 0)" }}>
                      {order.paymentStatus === "paid" ? "opłacone" : "nieopłacone"}
                      {order.paymentMethod ? ` · ${PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}` : ""}
                    </p>
                  </div>

                  <span>
                    <span
                      className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold"
                      style={{ background: st.bg, color: st.color }}
                    >
                      {st.label}
                    </span>
                  </span>

                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: "oklch(55% 0 0)" }}>{order.date}</span>
                    <ChevronRight className="w-3.5 h-3.5" style={{ color: "oklch(70% 0 0)" }} strokeWidth={2} />
                  </div>
                </Link>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
