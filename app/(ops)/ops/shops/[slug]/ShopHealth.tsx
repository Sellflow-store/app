import { and, desc, eq } from "drizzle-orm";
import { Check, X } from "lucide-react";
import { db } from "@/lib/db";
import { orders, products, shopConfig, shopIntegrations } from "@/lib/db/schema";
import { STATUS_STYLES, PAYMENT_LABELS } from "@/lib/order-status";
import { formatPln } from "@/lib/money";
import { tpayEnabled } from "@/lib/tpay-status";
import { catalogReadiness, shopSetupDone, SETUP_STEP_KEYS, SETUP_STEP_LABELS } from "@/lib/shop-setup";
import type { BrandingConfig } from "@/types/shop";

/**
 * „Stan sklepu" w /ops: ta sama checklista, którą klient widzi na Pulpicie,
 * integracje, gotowość katalogu dla Google i AI oraz ostatnie zamówienia.
 * Gdy klient dzwoni, zespół ma pełny obraz bez logowania jako właściciel.
 */
export default async function ShopHealth({
  shopId,
  shopName,
  customDomain,
  customDomainVerified,
  ordersBaseUrl,
}: {
  shopId: string;
  shopName: string;
  customDomain: string | null;
  customDomainVerified: boolean;
  /** Absolutny adres listy zamówień w panelu sklepu; null dla usuniętego. */
  ordersBaseUrl: string | null;
}) {
  const [configRows, productRows, onlinePayments, furgonetka, recent] = await Promise.all([
    db.select().from(shopConfig).where(eq(shopConfig.shopId, shopId)),
    db
      .select({
        visible: products.visible,
        type: products.type,
        priceOnRequest: products.priceOnRequest,
        images: products.images,
        shortDesc: products.shortDesc,
        description: products.description,
        category: products.category,
        weightGrams: products.weightGrams,
        attributes: products.attributes,
        specs: products.specs,
      })
      .from(products)
      .where(eq(products.shopId, shopId)),
    tpayEnabled(shopId),
    db.query.shopIntegrations.findFirst({
      where: and(eq(shopIntegrations.shopId, shopId), eq(shopIntegrations.provider, "furgonetka")),
    }),
    db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        customerName: orders.customerName,
        customerEmail: orders.customerEmail,
        total: orders.total,
        status: orders.status,
        paymentStatus: orders.paymentStatus,
        paymentMethod: orders.paymentMethod,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(eq(orders.shopId, shopId))
      .orderBy(desc(orders.createdAt))
      .limit(10),
  ]);

  const configMap = Object.fromEntries(configRows.map((c) => [c.key, c.value]));
  const branding = configMap.branding as Partial<BrandingConfig> | undefined;
  const done = shopSetupDone({
    configMap,
    productCount: productRows.length,
    onlinePayments,
    shopName: branding?.shopName || shopName,
  });
  const doneCount = SETUP_STEP_KEYS.filter((k) => done[k]).length;
  const readiness = catalogReadiness(productRows.filter((p) => p.visible));

  const integrations: { label: string; ok: boolean; detail: string }[] = [
    {
      label: "Tpay",
      ok: onlinePayments,
      detail: onlinePayments ? "włączony, klucze zapisane" : "niepodłączony",
    },
    {
      label: "Furgonetka",
      ok: !!furgonetka?.enabled,
      detail: furgonetka?.enabled
        ? furgonetka.lastPullAt
          ? `ostatnie pobranie ${furgonetka.lastPullAt.toLocaleString("pl-PL")}`
          : "włączona, jeszcze bez pobrania zamówień"
        : "niepodłączona",
    },
    {
      label: "Własna domena",
      ok: !customDomain || customDomainVerified,
      detail: customDomain
        ? `${customDomain} · ${customDomainVerified ? "zweryfikowana" : "niezweryfikowana, sklep pod nią nie działa"}`
        : "brak, sklep działa na subdomenie",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6 items-start">
        {/* ── Setup checklist ───────────────────────────────────── */}
        <Card title="Uruchomienie sklepu" hint={`${doneCount} z ${SETUP_STEP_KEYS.length}`}>
          <ul>
            {SETUP_STEP_KEYS.map((k) => (
              <Line key={k} ok={done[k]} label={SETUP_STEP_LABELS[k]} />
            ))}
          </ul>
        </Card>

        <div className="space-y-6">
          {/* ── Integrations ────────────────────────────────────── */}
          <Card title="Integracje">
            <ul>
              {integrations.map((i) => (
                <Line key={i.label} ok={i.ok} label={i.label} detail={i.detail} />
              ))}
            </ul>
          </Card>

          {/* ── Catalog readiness ───────────────────────────────── */}
          <Card title="Gotowość dla Google i AI">
            <div className="px-5 py-4 text-sm" style={{ borderTop: "1px solid var(--brand-rule)" }}>
              {readiness.total === 0 ? (
                <p style={{ color: "var(--brand-ink-2)" }}>Brak widocznych produktów.</p>
              ) : (
                <>
                  <p style={{ color: "var(--brand-ink)" }}>
                    <span className="font-bold tabular-nums">{readiness.readyCount}</span>
                    <span style={{ color: "var(--brand-ink-2)" }}>
                      {" "}
                      z {readiness.total} produktów z kompletem danych
                    </span>
                  </p>
                  {readiness.topGaps.length > 0 && (
                    <p className="text-[12px] mt-1" style={{ color: "var(--brand-ink-2)" }}>
                      Najczęściej brakuje:{" "}
                      {readiness.topGaps.map((g) => `${g.label.toLowerCase()} (${g.count})`).join(", ")}
                    </p>
                  )}
                </>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* ── Recent orders ───────────────────────────────────────── */}
      <Card title="Ostatnie zamówienia" hint={recent.length ? `${recent.length} najnowszych` : undefined}>
        {recent.length === 0 ? (
          <p
            className="px-5 py-6 text-sm"
            style={{ borderTop: "1px solid var(--brand-rule)", color: "var(--brand-ink-2)" }}
          >
            Jeszcze bez zamówień.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody>
                {recent.map((o) => {
                  const st = STATUS_STYLES[o.status] ?? STATUS_STYLES.pending;
                  const number = ordersBaseUrl ? (
                    <a href={`${ordersBaseUrl}/${o.id}`} className="font-semibold hover:underline">
                      {o.orderNumber}
                    </a>
                  ) : (
                    <span className="font-semibold">{o.orderNumber}</span>
                  );
                  return (
                    <tr key={o.id} style={{ borderTop: "1px solid var(--brand-rule)" }}>
                      <td className="px-5 py-2.5 whitespace-nowrap" style={{ color: "var(--brand-ink)" }}>
                        {number}
                        <div
                          className="text-[11px]"
                          style={{ color: "var(--brand-ink-2)", fontFamily: "var(--font-mono)" }}
                        >
                          {o.createdAt.toLocaleString("pl-PL")}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 max-w-[220px] truncate" style={{ color: "var(--brand-ink-2)" }}>
                        {o.customerName || o.customerEmail}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span
                          className="inline-flex text-[11px] font-medium px-2 py-0.5 rounded-full"
                          style={{ background: st.bg, color: st.color }}
                        >
                          {st.label}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-[12px]" style={{ color: "var(--brand-ink-2)" }}>
                        {o.paymentStatus === "paid" ? "opłacone" : o.paymentStatus === "refunded" ? "zwrócone" : "nieopłacone"}
                        {o.paymentMethod && ` · ${PAYMENT_LABELS[o.paymentMethod] ?? o.paymentMethod}`}
                      </td>
                      <td
                        className="px-5 py-2.5 whitespace-nowrap text-right font-semibold tabular-nums"
                        style={{ color: "var(--brand-ink)" }}
                      >
                        {formatPln(parseFloat(o.total))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function Card({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section
      className="rounded-2xl overflow-hidden"
      style={{ background: "var(--brand-paper)", border: "1px solid var(--brand-rule)" }}
    >
      <header
        className="flex items-baseline justify-between px-5 py-3"
        style={{ background: "var(--brand-paper-3)" }}
      >
        <h2
          className="text-[11px] font-semibold uppercase tracking-[0.18em]"
          style={{ color: "var(--brand-ink-2)", fontFamily: "var(--font-mono)" }}
        >
          {title}
        </h2>
        {hint && (
          <span className="text-[11px]" style={{ color: "var(--brand-ink-2)", fontFamily: "var(--font-mono)" }}>
            {hint}
          </span>
        )}
      </header>
      {children}
    </section>
  );
}

function Line({ ok, label, detail }: { ok: boolean; label: string; detail?: string }) {
  const Icon = ok ? Check : X;
  return (
    <li className="flex items-start gap-3 px-5 py-2.5" style={{ borderTop: "1px solid var(--brand-rule)" }}>
      <Icon
        className="w-4 h-4 mt-0.5 shrink-0"
        style={{ color: ok ? "var(--brand-success)" : "var(--panel-danger)" }}
        strokeWidth={2.25}
        aria-label={ok ? "gotowe" : "brak"}
      />
      <div className="min-w-0">
        <p className="text-sm" style={{ color: "var(--brand-ink)" }}>
          {label}
        </p>
        {detail && (
          <p className="text-[12px]" style={{ color: "var(--brand-ink-2)" }}>
            {detail}
          </p>
        )}
      </div>
    </li>
  );
}
