"use client";

import { ChevronRight, Package } from "lucide-react";

const STATUS_STYLES: Record<string, { label: string; bg: string; color: string }> = {
  new:       { label: "Nowe",        bg: "oklch(95% 0.08 260)", color: "oklch(35% 0.20 260)" },
  paid:      { label: "Opłacone",    bg: "oklch(94% 0.08 145)", color: "oklch(35% 0.18 145)" },
  shipped:   { label: "Wysłane",     bg: "oklch(94% 0.10 195)", color: "oklch(35% 0.18 195)" },
  delivered: { label: "Dostarczone", bg: "oklch(93% 0.08 145)", color: "oklch(30% 0.16 145)" },
  cancelled: { label: "Anulowane",  bg: "oklch(95% 0.05 20)",  color: "oklch(40% 0.18 20)"  },
};

export interface Order {
  id: string;
  customer: string;
  email: string;
  total: string;
  status: string;
  date: string;
}

export default function OrdersTable({ orders }: { orders: Order[] }) {
  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Package className="w-10 h-10" style={{ color: "oklch(80% 0 0)" }} strokeWidth={1} />
        <p className="text-sm" style={{ color: "oklch(55% 0 0)" }}>Brak zamówień</p>
      </div>
    );
  }

  return (
    <>
      {/* Header row */}
      <div
        className="grid text-[11px] font-semibold tracking-wide uppercase px-5 py-3"
        style={{
          gridTemplateColumns: "1fr 1.6fr 1fr 1fr 1fr",
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

      {orders.map((order, i) => {
        const st = STATUS_STYLES[order.status] ?? STATUS_STYLES.new;
        return (
          <div
            key={order.id}
            className="grid items-center px-5 py-3.5 cursor-pointer transition-colors"
            style={{
              gridTemplateColumns: "1fr 1.6fr 1fr 1fr 1fr",
              borderBottom: i < orders.length - 1 ? "1px solid oklch(94% 0 0)" : "none",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "oklch(98.5% 0.003 250)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "")}
          >
            <span
              className="text-xs font-semibold"
              style={{ color: "oklch(22% 0.24 270)", fontFamily: "var(--font-display)" }}
            >
              {order.id}
            </span>

            <div className="min-w-0">
              <p className="text-xs font-medium truncate" style={{ color: "oklch(15% 0 0)" }}>
                {order.customer}
              </p>
              <p className="text-[11px] truncate" style={{ color: "oklch(55% 0 0)" }}>
                {order.email}
              </p>
            </div>

            <span className="text-xs font-semibold" style={{ color: "oklch(11% 0.10 275)" }}>
              {order.total}
            </span>

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
          </div>
        );
      })}
    </>
  );
}
