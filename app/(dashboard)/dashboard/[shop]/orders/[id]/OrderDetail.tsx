"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Package, Truck, CheckCircle2, XCircle, Banknote } from "lucide-react";
import { STATUS_STYLES, PAYMENT_LABELS } from "../OrdersTable";

interface OrderData {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  items: { name: string; price: string; qty: number; image: string | null }[];
  subtotal: string;
  shippingCost: string;
  total: string;
  status: string;
  paymentMethod: string | null;
  paymentStatus: string;
  shippingAddress: Record<string, string | undefined>;
  notes: string | null;
  createdAt: string;
}

const pln = (v: string) => `${parseFloat(v).toFixed(2).replace(".", ",")} zł`;

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-5" style={{ background: "#fff", border: "1px solid oklch(90% 0 0)" }}>
      <h2
        className="text-sm font-semibold mb-4"
        style={{ fontFamily: "var(--font-display)", color: "oklch(11% 0.10 275)" }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}

interface Props {
  shopSlug: string;
  order: OrderData;
}

export default function OrderDetail({ shopSlug, order }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const st = STATUS_STYLES[order.status] ?? STATUS_STYLES.pending;
  const addr = order.shippingAddress;

  async function update(patch: { status?: string; paymentStatus?: string }) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/shops/${shopSlug}/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        setError("Nie udało się zapisać zmiany. Spróbuj ponownie.");
        return;
      }
      router.refresh();
    } catch {
      setError("Nie udało się zapisać zmiany. Spróbuj ponownie.");
    } finally {
      setBusy(false);
    }
  }

  const ACTIONS: { label: string; icon: typeof Package; status: string; show: boolean }[] = [
    { label: "W realizacji", icon: Package, status: "processing", show: order.status === "pending" },
    { label: "Oznacz jako wysłane", icon: Truck, status: "shipped", show: ["pending", "processing"].includes(order.status) },
    { label: "Dostarczone", icon: CheckCircle2, status: "delivered", show: order.status === "shipped" },
    { label: "Anuluj zamówienie", icon: XCircle, status: "cancelled", show: ["pending", "processing"].includes(order.status) },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/${shopSlug}/orders`}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: "oklch(45% 0 0)", border: "1px solid oklch(88% 0 0)" }}
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1
                className="text-xl font-bold"
                style={{ fontFamily: "var(--font-display)", color: "oklch(11% 0.10 275)" }}
              >
                {order.orderNumber}
              </h1>
              <span
                className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold"
                style={{ background: st.bg, color: st.color }}
              >
                {st.label}
              </span>
            </div>
            <p className="text-xs mt-0.5" style={{ color: "oklch(50% 0 0)" }}>
              Złożone {order.createdAt}
            </p>
          </div>
        </div>

        {/* Status actions */}
        <div className="flex gap-2 flex-wrap">
          {ACTIONS.filter((a) => a.show).map((a) => (
            <button
              key={a.status}
              onClick={() => update({ status: a.status })}
              disabled={busy}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full transition-all disabled:opacity-50"
              style={
                a.status === "cancelled"
                  ? { color: "oklch(45% 0.18 20)", border: "1.5px solid oklch(50% 0.20 20 / 0.3)" }
                  : { background: "oklch(56% 0.30 335)", color: "#fff" }
              }
            >
              <a.icon className="w-3.5 h-3.5" strokeWidth={1.5} />
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div
          className="rounded-xl px-4 py-3 mb-5 text-xs font-medium"
          style={{ background: "oklch(50% 0.20 20 / 0.08)", color: "oklch(40% 0.18 20)", border: "1px solid oklch(50% 0.20 20 / 0.25)" }}
        >
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_18rem] gap-5 items-start">
        {/* Left column */}
        <div className="space-y-5">
          {/* Items */}
          <Card title="Pozycje zamówienia">
            <div className="divide-y" style={{ borderColor: "oklch(94% 0 0)" }}>
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div
                    className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center shrink-0"
                    style={{ background: "oklch(95% 0.008 250)" }}
                  >
                    {item.image ? (
                      <img src={item.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-4 h-4" style={{ color: "oklch(65% 0 0)" }} strokeWidth={1.5} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate" style={{ color: "oklch(15% 0 0)" }}>
                      {item.name}
                    </p>
                    <p className="text-[11px]" style={{ color: "oklch(55% 0 0)" }}>
                      {pln(item.price)} × {item.qty}
                    </p>
                  </div>
                  <span className="text-xs font-semibold tabular-nums" style={{ color: "oklch(11% 0.10 275)" }}>
                    {pln(String(parseFloat(item.price) * item.qty))}
                  </span>
                </div>
              ))}
            </div>

            <dl className="mt-4 pt-4 space-y-1.5 text-xs" style={{ borderTop: "1px solid oklch(92% 0 0)" }}>
              <div className="flex justify-between">
                <dt style={{ color: "oklch(50% 0 0)" }}>Produkty</dt>
                <dd className="tabular-nums" style={{ color: "oklch(25% 0 0)" }}>{pln(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt style={{ color: "oklch(50% 0 0)" }}>
                  Dostawa{addr.deliveryMethod ? ` (${addr.deliveryMethod})` : ""}
                </dt>
                <dd className="tabular-nums" style={{ color: "oklch(25% 0 0)" }}>{pln(order.shippingCost)}</dd>
              </div>
              {addr.codFee && (
                <div className="flex justify-between">
                  <dt style={{ color: "oklch(50% 0 0)" }}>Pobranie</dt>
                  <dd className="tabular-nums" style={{ color: "oklch(25% 0 0)" }}>{pln(addr.codFee)}</dd>
                </div>
              )}
              <div className="flex justify-between pt-2 text-sm font-bold" style={{ color: "oklch(11% 0.10 275)" }}>
                <dt>Razem</dt>
                <dd className="tabular-nums">{pln(order.total)}</dd>
              </div>
            </dl>
          </Card>

          {order.notes && (
            <Card title="Uwagi klienta">
              <p className="text-xs whitespace-pre-line" style={{ color: "oklch(35% 0 0)" }}>
                {order.notes}
              </p>
            </Card>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-5">
          <Card title="Płatność">
            <p className="text-xs mb-3" style={{ color: "oklch(35% 0 0)" }}>
              {order.paymentMethod ? PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod : "—"}
              {" · "}
              <span
                className="font-semibold"
                style={{ color: order.paymentStatus === "paid" ? "oklch(40% 0.16 145)" : "oklch(45% 0.15 20)" }}
              >
                {order.paymentStatus === "paid" ? "opłacone" : "nieopłacone"}
              </span>
            </p>
            <button
              onClick={() => update({ paymentStatus: order.paymentStatus === "paid" ? "unpaid" : "paid" })}
              disabled={busy}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-all disabled:opacity-50"
              style={{ border: "1.5px solid oklch(85% 0 0)", color: "oklch(30% 0 0)", background: "oklch(97% 0 0)" }}
            >
              <Banknote className="w-3.5 h-3.5" strokeWidth={1.5} />
              {order.paymentStatus === "paid" ? "Oznacz jako nieopłacone" : "Oznacz jako opłacone"}
            </button>
          </Card>

          <Card title="Klient">
            <p className="text-xs font-medium" style={{ color: "oklch(15% 0 0)" }}>{order.customerName}</p>
            <p className="text-xs mt-1" style={{ color: "oklch(45% 0 0)" }}>{order.customerEmail}</p>
            {order.customerPhone && (
              <p className="text-xs mt-0.5" style={{ color: "oklch(45% 0 0)" }}>{order.customerPhone}</p>
            )}
          </Card>

          <Card title="Adres dostawy">
            <p className="text-xs leading-relaxed" style={{ color: "oklch(35% 0 0)" }}>
              {addr.name}
              <br />
              {addr.street}
              <br />
              {addr.zip} {addr.city}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
