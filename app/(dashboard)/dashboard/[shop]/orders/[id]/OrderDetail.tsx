"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Package, Truck, CheckCircle2, XCircle, Banknote, ExternalLink, Mail, Phone, Copy, Check } from "lucide-react";
import { CARRIERS, trackingUrl } from "@/lib/tracking";
import { STATUS_STYLES, PAYMENT_LABELS } from "@/lib/order-status";
import { formatPln } from "@/lib/money";
import { formatNip, invoiceSummary, type InvoiceData } from "@/lib/invoice";

interface OrderData {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  items: { name: string; price: string; qty: number; image: string | null; size?: string | null }[];
  subtotal: string;
  shippingCost: string;
  total: string;
  status: string;
  paymentMethod: string | null;
  paymentStatus: string;
  shippingAddress: Record<string, string | undefined>;
  /** Dane do faktury VAT, jeśli klient o nią poprosił. */
  invoice: InvoiceData | null;
  pickupPoint: { code?: string; name?: string; address?: string } | null;
  carrier: string | null;
  trackingNumber: string | null;
  notes: string | null;
  createdAt: string;
}

const pln = (v: string) => formatPln(v);

const FIELD =
  "w-full h-9 px-3 rounded-lg text-[13.5px] outline-none transition-colors border border-[var(--panel-border)] bg-[var(--panel-surface)] text-[var(--panel-ink)] focus:border-[var(--panel-primary)]";
const LABEL = "block text-[12.5px] font-medium mb-1.5 text-[var(--panel-ink-muted)]";

function Card({ title, children, aside }: { title: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-[var(--panel-border)] bg-[var(--panel-surface)]">
      <div className="flex items-center justify-between gap-3 px-5 h-12 border-b border-[var(--panel-border)]">
        <h2 className="text-[15px] font-semibold text-[var(--panel-ink)]" style={{ fontFamily: "var(--font-display)" }}>
          {title}
        </h2>
        {aside}
      </div>
      <div className="p-5">{children}</div>
    </section>
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
  // Przy paczkomacie przewoźnik jest znany z góry — nie każemy go wybierać.
  const [carrier, setCarrier] = useState(order.carrier ?? (order.pickupPoint?.code ? "inpost" : ""));
  const [tracking, setTracking] = useState(order.trackingNumber ?? "");
  const [shipSaved, setShipSaved] = useState(false);
  const [shipError, setShipError] = useState<string | null>(null);
  const [shipBusy, setShipBusy] = useState(false);
  const [invoiceCopied, setInvoiceCopied] = useState(false);

  const st = STATUS_STYLES[order.status] ?? STATUS_STYLES.pending;
  const addr = order.shippingAddress;
  const point = order.pickupPoint?.code ? order.pickupPoint : null;
  const savedTrackingUrl = trackingUrl(order.carrier, order.trackingNumber);

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
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Nie udało się zapisać zmiany. Spróbuj ponownie.");
        router.refresh();
        return;
      }
      router.refresh();
    } catch {
      setError("Nie udało się zapisać zmiany. Spróbuj ponownie.");
    } finally {
      setBusy(false);
    }
  }

  async function saveShipping() {
    setShipBusy(true);
    setShipError(null);
    setShipSaved(false);
    try {
      const res = await fetch(`/api/shops/${shopSlug}/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ carrier: carrier || null, trackingNumber: tracking || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setShipError(data.error ?? "Nie udało się zapisać. Spróbuj ponownie.");
        return;
      }
      setShipSaved(true);
      setTimeout(() => setShipSaved(false), 2500);
      router.refresh();
    } catch {
      setShipError("Nie udało się zapisać. Spróbuj ponownie.");
    } finally {
      setShipBusy(false);
    }
  }

  const ACTIONS: { label: string; icon: typeof Package; status: string; show: boolean }[] = [
    { label: "W realizacji", icon: Package, status: "processing", show: order.status === "pending" },
    { label: "Oznacz jako wysłane", icon: Truck, status: "shipped", show: ["pending", "processing"].includes(order.status) },
    { label: "Dostarczone", icon: CheckCircle2, status: "delivered", show: order.status === "shipped" },
    { label: "Anuluj zamówienie", icon: XCircle, status: "cancelled", show: ["pending", "processing"].includes(order.status) },
  ];

  const paid = order.paymentStatus === "paid";
  const primaryActions = ACTIONS.filter((a) => a.show && a.status !== "cancelled");
  const cancelAction = ACTIONS.find((a) => a.show && a.status === "cancelled");

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-6xl mx-auto">
      <Link
        href={`/dashboard/${shopSlug}/orders`}
        className="inline-flex items-center gap-1.5 text-[13px] font-medium mb-4 text-[var(--panel-ink-muted)] hover:text-[var(--panel-ink)] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
        Zamówienia
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold text-[var(--panel-ink)]" style={{ fontFamily: "var(--font-mono)" }}>
              {order.orderNumber}
            </h1>
            <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[13px] font-medium border border-[var(--panel-border)] text-[var(--panel-ink)]">
              <span aria-hidden className="w-2 h-2 rounded-full" style={{ background: st.dot }} />
              {st.label}
            </span>
            <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[13px] font-medium border border-[var(--panel-border)] text-[var(--panel-ink)]">
              <span
                aria-hidden
                className="w-2 h-2 rounded-[2px]"
                style={paid ? { background: "var(--panel-success)" } : { border: "1.5px solid var(--panel-warning)" }}
              />
              {paid ? "Opłacone" : "Czeka na płatność"}
            </span>
          </div>
          <p className="text-[13px] mt-1.5 text-[var(--panel-ink-muted)]">Złożone {order.createdAt}</p>
        </div>

        {/* Status actions */}
        <div className="flex gap-2 flex-wrap">
          {cancelAction && (
            <button
              onClick={() => update({ status: cancelAction.status })}
              disabled={busy}
              className="flex items-center gap-2 h-9 px-3.5 rounded-lg text-[13px] font-medium transition-colors disabled:opacity-50 border border-[var(--panel-border)] text-[oklch(50%_0.19_25)] hover:border-[oklch(60%_0.19_25)]"
            >
              <cancelAction.icon className="w-4 h-4" strokeWidth={1.75} />
              {cancelAction.label}
            </button>
          )}
          {primaryActions.map((a, i) => (
            <button
              key={a.status}
              onClick={() => update({ status: a.status })}
              disabled={busy}
              className={[
                "flex items-center gap-2 h-9 px-3.5 rounded-lg text-[13px] font-semibold transition-colors disabled:opacity-50",
                i === primaryActions.length - 1
                  ? "bg-[var(--panel-primary)] text-[var(--panel-surface)] hover:opacity-90"
                  : "border border-[var(--panel-border)] text-[var(--panel-ink)] hover:border-[var(--panel-border-strong)]",
              ].join(" ")}
            >
              <a.icon className="w-4 h-4" strokeWidth={1.75} />
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-lg px-4 py-3 mb-5 text-[13px] font-medium bg-[oklch(50%_0.20_20/0.08)] text-[oklch(45%_0.18_20)] border border-[oklch(50%_0.20_20/0.25)]">
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-[minmax(0,1fr)_20rem] gap-5 items-start">
        {/* Left column */}
        <div className="flex flex-col gap-5 min-w-0">
          <Card title="Pozycje zamówienia" aside={<span className="text-[12.5px] text-[var(--panel-ink-muted)]">{order.items.length} poz.</span>}>
            <ul className="divide-y divide-[var(--panel-border)] -my-3">
              {order.items.map((item, i) => (
                <li key={i} className="flex items-center gap-3.5 py-3">
                  <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center shrink-0 bg-[var(--panel-surface-2)] border border-[var(--panel-border)]">
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-4 h-4 text-[var(--panel-ink-faint)]" strokeWidth={1.5} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] font-medium truncate text-[var(--panel-ink)]">{item.name}</p>
                    <p className="text-[12.5px] mt-0.5 text-[var(--panel-ink-muted)]">
                      {item.size ? `Rozmiar ${item.size} · ` : ""}
                      {pln(item.price)} × {item.qty}
                    </p>
                  </div>
                  <span className="text-[13.5px] font-semibold tabular-nums text-[var(--panel-ink)]">
                    {pln(String(parseFloat(item.price) * item.qty))}
                  </span>
                </li>
              ))}
            </ul>

            <dl className="mt-5 pt-4 flex flex-col gap-2 text-[13.5px] border-t border-[var(--panel-border)]">
              <div className="flex justify-between">
                <dt className="text-[var(--panel-ink-muted)]">Produkty</dt>
                <dd className="tabular-nums text-[var(--panel-ink)]">{pln(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[var(--panel-ink-muted)]">Dostawa{addr.deliveryMethod ? ` (${addr.deliveryMethod})` : ""}</dt>
                <dd className="tabular-nums text-[var(--panel-ink)]">{pln(order.shippingCost)}</dd>
              </div>
              {addr.codFee && (
                <div className="flex justify-between">
                  <dt className="text-[var(--panel-ink-muted)]">Pobranie</dt>
                  <dd className="tabular-nums text-[var(--panel-ink)]">{pln(addr.codFee)}</dd>
                </div>
              )}
              <div className="flex justify-between pt-2 text-[15px] font-semibold text-[var(--panel-ink)]">
                <dt>Razem</dt>
                <dd className="tabular-nums">{pln(order.total)}</dd>
              </div>
            </dl>
          </Card>

          {order.notes && (
            <Card title="Uwagi klienta">
              <p className="text-[13.5px] whitespace-pre-line text-[var(--panel-ink)]">{order.notes}</p>
            </Card>
          )}
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-5">
          <Card title="Klient">
            <p className="text-[14px] font-medium text-[var(--panel-ink)]">{order.customerName}</p>
            <a href={`mailto:${order.customerEmail}`} className="flex items-center gap-2 mt-2 text-[13px] text-[var(--panel-primary)] hover:underline break-all">
              <Mail className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
              {order.customerEmail}
            </a>
            {order.customerPhone && (
              <a href={`tel:${order.customerPhone}`} className="flex items-center gap-2 mt-1.5 text-[13px] text-[var(--panel-primary)] hover:underline">
                <Phone className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
                {order.customerPhone}
              </a>
            )}
          </Card>

          {order.invoice && (
            <Card
              title="Faktura VAT"
              aside={
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(invoiceSummary(order.invoice!));
                    setInvoiceCopied(true);
                    setTimeout(() => setInvoiceCopied(false), 2000);
                  }}
                  className="inline-flex items-center gap-1.5 h-7 px-2 rounded-md text-[12.5px] font-medium border border-[var(--panel-border)] text-[var(--panel-ink-muted)] hover:text-[var(--panel-ink)] hover:border-[var(--panel-border-strong)]"
                >
                  {invoiceCopied ? <Check className="w-3.5 h-3.5" strokeWidth={2} /> : <Copy className="w-3.5 h-3.5" strokeWidth={1.75} />}
                  {invoiceCopied ? "Skopiowano" : "Kopiuj"}
                </button>
              }
            >
              <p className="text-[13.5px] font-medium text-[var(--panel-ink)]">{order.invoice.companyName}</p>
              <p className="text-[13px] mt-1 text-[var(--panel-ink)]">NIP: {formatNip(order.invoice.taxId)}</p>
              <p className="text-[13px] mt-1 leading-relaxed text-[var(--panel-ink-muted)]">
                {order.invoice.street}
                <br />
                {order.invoice.zip} {order.invoice.city}
              </p>
              <p className="text-[12.5px] mt-3 leading-relaxed text-[var(--panel-ink-faint)]">
                Klient prosi o fakturę. Wystaw ją w swoim programie księgowym i wyślij na {order.customerEmail}.
              </p>
            </Card>
          )}

          <Card title={point ? "Paczkomat" : "Adres dostawy"}>
            {point ? (
              <>
                <p className="text-[13.5px] font-semibold text-[var(--panel-ink)]" style={{ fontFamily: "var(--font-mono)" }}>{point.code}</p>
                <p className="text-[13px] mt-1 leading-relaxed text-[var(--panel-ink)]">{point.address}</p>
                <p className="text-[13px] mt-2 leading-relaxed text-[var(--panel-ink-muted)]">
                  Odbiorca: {addr.name}
                  {addr.zip || addr.city ? (
                    <>
                      <br />
                      {addr.zip} {addr.city}
                    </>
                  ) : null}
                </p>
              </>
            ) : (
              <p className="text-[13.5px] leading-relaxed text-[var(--panel-ink)]">
                {addr.name}
                <br />
                {addr.street}
                <br />
                {addr.zip} {addr.city}
              </p>
            )}
          </Card>

          <Card title="Płatność">
            <p className="text-[13.5px] mb-3 text-[var(--panel-ink)]">
              {order.paymentMethod ? PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod : "—"}
              {" · "}
              <span className={paid ? "font-semibold text-[var(--panel-success)]" : "font-semibold text-[oklch(55%_0.15_60)]"}>
                {paid ? "opłacone" : "nieopłacone"}
              </span>
            </p>
            <button
              onClick={() => update({ paymentStatus: paid ? "unpaid" : "paid" })}
              disabled={busy}
              className="flex items-center gap-2 h-9 px-3.5 rounded-lg text-[13px] font-medium transition-colors disabled:opacity-50 border border-[var(--panel-border)] text-[var(--panel-ink)] hover:border-[var(--panel-border-strong)]"
            >
              <Banknote className="w-4 h-4 text-[var(--panel-ink-muted)]" strokeWidth={1.75} />
              {paid ? "Oznacz jako nieopłacone" : "Oznacz jako opłacone"}
            </button>
          </Card>

          <Card title="Przesyłka">
            <div className="flex flex-col gap-3">
              <div>
                <label htmlFor="od-carrier" className={LABEL}>Przewoźnik</label>
                <select id="od-carrier" value={carrier} onChange={(e) => setCarrier(e.target.value)} className={FIELD}>
                  <option value="">Wybierz</option>
                  {CARRIERS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="od-tracking" className={LABEL}>Numer przesyłki</label>
                <input
                  id="od-tracking"
                  value={tracking}
                  onChange={(e) => setTracking(e.target.value)}
                  placeholder="np. 640012345678901234567890"
                  className={FIELD}
                  style={{ fontFamily: "var(--font-mono)" }}
                />
              </div>

              {shipError && <p className="text-[12.5px] text-[oklch(50%_0.20_20)]">{shipError}</p>}

              <button
                onClick={saveShipping}
                disabled={shipBusy}
                className={[
                  "w-full h-9 rounded-lg text-[13px] font-semibold transition-colors disabled:opacity-60 text-[var(--panel-surface)]",
                  shipSaved ? "bg-[var(--panel-success)]" : "bg-[var(--panel-primary)] hover:opacity-90",
                ].join(" ")}
              >
                {shipBusy ? "Zapisywanie…" : shipSaved ? "Zapisano" : "Zapisz przesyłkę"}
              </button>

              {savedTrackingUrl ? (
                <a
                  href={savedTrackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 text-[13px] font-medium text-[var(--panel-primary)] hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.75} />
                  Śledź {order.trackingNumber}
                </a>
              ) : null}

              <p className="text-[12.5px] leading-relaxed text-[var(--panel-ink-faint)]">
                {order.status === "shipped"
                  ? "Zamówienie jest już oznaczone jako wysłane. Mail z numerem przesyłki poszedł przy tej zmianie."
                  : "Uzupełnij numer przed oznaczeniem zamówienia jako wysłane, a klient dostanie go w mailu."}
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
