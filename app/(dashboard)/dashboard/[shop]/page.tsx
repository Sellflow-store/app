import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { shops, shopConfig, products, orders } from "@/lib/db/schema";
import { and, count, desc, eq, gte, inArray, ne, sum } from "drizzle-orm";
import { getShopAccess } from "@/lib/api";
import type { BrandingConfig, CheckoutConfig, LegalConfig, AboutConfig } from "@/types/shop";
import {
  Package, Palette, Truck, CreditCard, FileText, Info,
  Plus, ClipboardList, Home as HomeIcon, Eye, ArrowRight, Check,
} from "lucide-react";

const pln = (v: number) => `${v.toFixed(2).replace(".", ",")} zł`;

export default async function DashboardHome({
  params,
}: {
  params: Promise<{ shop: string }>;
}) {
  const { shop: shopSlug } = await params;
  const access = await getShopAccess(shopSlug);
  if (!access) redirect("/onboarding");

  const base = `/dashboard/${shopSlug}`;
  const d30 = new Date(Date.now() - 30 * 24 * 3600 * 1000);
  const notCancelled = ne(orders.status, "cancelled");

  const [shop, configRows, [{ products: productCount }], agg30, recent, [{ toShip }], [{ unpaid }]] =
    await Promise.all([
      db.query.shops.findFirst({ where: eq(shops.id, access.shopId) }),
      db.select().from(shopConfig).where(eq(shopConfig.shopId, access.shopId)),
      db.select({ products: count() }).from(products).where(eq(products.shopId, access.shopId)),
      db
        .select({ total: count(), gmv: sum(orders.total) })
        .from(orders)
        .where(and(eq(orders.shopId, access.shopId), notCancelled, gte(orders.createdAt, d30))),
      db
        .select({
          id: orders.id,
          orderNumber: orders.orderNumber,
          customerName: orders.customerName,
          total: orders.total,
          status: orders.status,
          paymentStatus: orders.paymentStatus,
          createdAt: orders.createdAt,
        })
        .from(orders)
        .where(eq(orders.shopId, access.shopId))
        .orderBy(desc(orders.createdAt))
        .limit(5),
      db
        .select({ toShip: count() })
        .from(orders)
        .where(and(eq(orders.shopId, access.shopId), inArray(orders.status, ["pending", "processing"]))),
      db
        .select({ unpaid: count() })
        .from(orders)
        .where(and(eq(orders.shopId, access.shopId), eq(orders.paymentStatus, "unpaid"), notCancelled)),
    ]);

  const configMap = Object.fromEntries(configRows.map((c) => [c.key, c.value]));
  const branding = configMap.branding as Partial<BrandingConfig> | undefined;
  const checkout = configMap.checkout as Partial<CheckoutConfig> | undefined;
  const terms = configMap.terms as Partial<LegalConfig> | undefined;
  const about = configMap.about as Partial<AboutConfig> | undefined;

  const shopName = branding?.shopName || shop?.name || shopSlug;

  // ── Setup checklist ──────────────────────────────────────────────────────
  const steps = [
    { label: "Dodaj pierwszy produkt", href: `${base}/products/new`, done: productCount > 0 },
    { label: "Wgraj logo sklepu", href: `${base}/branding`, done: !!branding?.logoUrl },
    { label: "Ustaw metody dostawy", href: `${base}/delivery`, done: !!configMap.delivery },
    {
      label: "Skonfiguruj płatności",
      href: `${base}/payments`,
      done: !!checkout && ((checkout.transferEnabled ? !!checkout.bankAccount : false) || !!checkout.codEnabled),
    },
    { label: "Uzupełnij regulamin", href: `${base}/legal`, done: !!terms?.content?.trim() },
    { label: "Dodaj dane „O nas” i kontakt", href: `${base}/about`, done: !!(about?.content?.trim() || about?.email?.trim()) },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  const allDone = doneCount === steps.length;
  const pct = Math.round((doneCount / steps.length) * 100);

  const gmv30 = parseFloat(agg30[0]?.gmv ?? "0") || 0;
  const orders30 = agg30[0]?.total ?? 0;

  const tiles = [
    { label: "Sprzedaż (30 dni)", value: pln(gmv30), href: `${base}/stats`, accent: false },
    { label: "Zamówienia (30 dni)", value: String(orders30), href: `${base}/stats`, accent: false },
    { label: "Do obsługi", value: String(toShip), href: `${base}/orders`, accent: toShip > 0 },
    { label: "Nieopłacone", value: String(unpaid), href: `${base}/orders`, accent: unpaid > 0 },
  ];

  const STATUS_LABEL: Record<string, string> = {
    pending: "Nowe", processing: "W realizacji", shipped: "Wysłane",
    delivered: "Dostarczone", cancelled: "Anulowane",
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Greeting */}
      <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: "var(--font-display)", color: "oklch(11% 0.10 275)" }}
          >
            Cześć, {shopName} 👋
          </h1>
          <p className="text-xs mt-1" style={{ color: "oklch(50% 0 0)" }}>
            Oto co dzieje się w Twoim sklepie.
          </p>
        </div>
        <Link
          href={`/${shopSlug}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-full transition-all"
          style={{ border: "1.5px solid oklch(88% 0 0)", color: "oklch(25% 0 0)", background: "#fff" }}
        >
          <Eye className="w-3.5 h-3.5" strokeWidth={1.5} />
          Zobacz sklep
        </Link>
      </div>

      {/* Setup checklist */}
      {!allDone && (
        <div
          className="rounded-2xl p-5 mb-6"
          style={{ background: "#fff", border: "1px solid oklch(90% 0 0)" }}
        >
          <div className="flex items-center justify-between mb-1">
            <h2
              className="text-sm font-semibold"
              style={{ fontFamily: "var(--font-display)", color: "oklch(11% 0.10 275)" }}
            >
              Skonfiguruj swój sklep
            </h2>
            <span className="text-xs font-semibold tabular-nums" style={{ color: "oklch(45% 0 0)" }}>
              {doneCount}/{steps.length}
            </span>
          </div>
          {/* Progress bar */}
          <div className="h-1.5 rounded-full mb-4 overflow-hidden" style={{ background: "oklch(93% 0 0)" }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${pct}%`, background: "oklch(56% 0.30 335)" }}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-2">
            {steps.map((s) => (
              <Link
                key={s.label}
                href={s.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors"
                style={{ background: s.done ? "oklch(97% 0.02 150)" : "oklch(98% 0 0)" }}
              >
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                  style={
                    s.done
                      ? { background: "oklch(52% 0.20 158)", color: "#fff" }
                      : { border: "1.5px solid oklch(80% 0 0)" }
                  }
                >
                  {s.done && <Check className="w-3 h-3" strokeWidth={3} />}
                </span>
                <span
                  className="text-xs flex-1"
                  style={{
                    color: s.done ? "oklch(45% 0.05 150)" : "oklch(20% 0 0)",
                    textDecoration: s.done ? "line-through" : "none",
                    fontWeight: s.done ? 400 : 500,
                  }}
                >
                  {s.label}
                </span>
                {!s.done && <ArrowRight className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} style={{ color: "oklch(60% 0 0)" }} />}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Stat tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {tiles.map((t) => (
          <Link
            key={t.label}
            href={t.href}
            className="rounded-2xl p-4 transition-all"
            style={{
              background: "#fff",
              border: `1px solid ${t.accent ? "oklch(56% 0.30 335 / 0.4)" : "oklch(90% 0 0)"}`,
            }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] mb-2" style={{ color: "oklch(50% 0 0)" }}>
              {t.label}
            </p>
            <p
              className="text-2xl font-bold tabular-nums"
              style={{ fontFamily: "var(--font-display)", color: t.accent ? "oklch(46% 0.25 333)" : "oklch(11% 0.10 275)" }}
            >
              {t.value}
            </p>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1.6fr_1fr] gap-6 items-start">
        {/* Recent orders */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "#fff", border: "1px solid oklch(90% 0 0)" }}
        >
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid oklch(92% 0 0)" }}>
            <h2 className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)", color: "oklch(11% 0.10 275)" }}>
              Ostatnie zamówienia
            </h2>
            <Link href={`${base}/orders`} className="text-[11px] font-medium" style={{ color: "oklch(22% 0.24 270)" }}>
              Wszystkie →
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="px-5 py-10 text-sm text-center" style={{ color: "oklch(55% 0 0)" }}>
              Brak zamówień — pojawią się tu po pierwszym zakupie
            </p>
          ) : (
            recent.map((o, i) => (
              <Link
                key={o.id}
                href={`${base}/orders/${o.id}`}
                className="flex items-center justify-between gap-3 px-5 py-3"
                style={{ borderTop: i > 0 ? "1px solid oklch(94% 0 0)" : "none" }}
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold" style={{ color: "oklch(22% 0.24 270)", fontFamily: "var(--font-display)" }}>
                    {o.orderNumber}
                    <span className="font-normal ml-2" style={{ color: "oklch(40% 0 0)" }}>
                      {o.customerName ?? "—"}
                    </span>
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: "oklch(55% 0 0)" }}>
                    {STATUS_LABEL[o.status] ?? o.status}
                    {o.paymentStatus === "unpaid" ? " · nieopłacone" : ""}
                  </p>
                </div>
                <span className="text-xs font-semibold tabular-nums shrink-0" style={{ color: "oklch(11% 0.10 275)" }}>
                  {pln(parseFloat(o.total))}
                </span>
              </Link>
            ))
          )}
        </div>

        {/* Quick actions */}
        <div
          className="rounded-2xl p-5"
          style={{ background: "#fff", border: "1px solid oklch(90% 0 0)" }}
        >
          <h2 className="text-sm font-semibold mb-4" style={{ fontFamily: "var(--font-display)", color: "oklch(11% 0.10 275)" }}>
            Szybkie akcje
          </h2>
          <div className="space-y-2">
            <QuickAction href={`${base}/products/new`} icon={Plus} label="Dodaj produkt" primary />
            <QuickAction href={`${base}/orders`} icon={ClipboardList} label="Zarządzaj zamówieniami" />
            <QuickAction href={`${base}/home`} icon={HomeIcon} label="Edytuj stronę główną" />
            <QuickAction href={`${base}/branding`} icon={Palette} label="Logo i kolorystyka" />
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickAction({
  href, icon: Icon, label, primary,
}: { href: string; icon: typeof Plus; label: string; primary?: boolean }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all"
      style={
        primary
          ? { background: "oklch(56% 0.30 335)", color: "#fff" }
          : { border: "1.5px solid oklch(88% 0 0)", color: "oklch(25% 0 0)" }
      }
    >
      <Icon className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
      {label}
    </Link>
  );
}
