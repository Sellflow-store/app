import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { shops, shopConfig, products, orders } from "@/lib/db/schema";
import { and, count, desc, eq, gte, inArray, ne, sum } from "drizzle-orm";
import { getShopAccess } from "@/lib/api";
import { STATUS_STYLES } from "@/lib/order-status";
import { formatPln } from "@/lib/money";
import { tpayEnabled } from "@/lib/tpay-status";
import type {
  BrandingConfig, CheckoutConfig, LegalConfig, AboutConfig, AccountConfig, LegalDataConfig,
} from "@/types/shop";
import {
  DEFAULT_ABOUT, DEFAULT_ACCOUNT, DEFAULT_CHECKOUT, normalizeDeliveryConfig,
} from "@/lib/shop";
import { missingLegalFields, normalizeLegalData, resolveLegalFields } from "@/lib/legal";
import {
  Package, Palette, Truck, CreditCard, FileText, Info,
  Plus, ClipboardList, Home as HomeIcon, Eye, ArrowRight, Check,
} from "lucide-react";

const pln = (v: number) => formatPln(v);

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

  const [shop, configRows, [{ products: productCount }], agg30, recent, [{ toShip }], [{ unpaid }], onlinePayments] =
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
      tpayEnabled(access.shopId),
    ]);

  const configMap = Object.fromEntries(configRows.map((c) => [c.key, c.value]));
  const branding = configMap.branding as Partial<BrandingConfig> | undefined;
  const checkout = configMap.checkout as Partial<CheckoutConfig> | undefined;
  const terms = configMap.terms as Partial<LegalConfig> | undefined;
  const about = configMap.about as Partial<AboutConfig> | undefined;

  const shopName = branding?.shopName || shop?.name || shopSlug;

  const savedAccount = (configMap.account as Partial<AccountConfig>) ?? {};
  const legalComplete =
    missingLegalFields(
      resolveLegalFields({
        legal: normalizeLegalData(configMap.legal as Partial<LegalDataConfig> | undefined),
        account: {
          ...DEFAULT_ACCOUNT,
          ...savedAccount,
          company: { ...DEFAULT_ACCOUNT.company, ...(savedAccount.company ?? {}) },
        },
        about: { ...DEFAULT_ABOUT, ...(about ?? {}) },
        branding: branding as never,
        checkout: { ...DEFAULT_CHECKOUT, ...(checkout ?? {}) },
        delivery: normalizeDeliveryConfig(configMap.delivery as never),
        shopName,
        shopUrl: "",
      })
    ).length === 0;

  // ── Setup checklist ──────────────────────────────────────────────────────
  const steps = [
    { label: "Dodaj pierwszy produkt", href: `${base}/products/new`, done: productCount > 0 },
    { label: "Wgraj logo sklepu", href: `${base}/branding`, done: !!branding?.logoUrl },
    { label: "Ustaw metody dostawy", href: `${base}/delivery`, done: !!configMap.delivery },
    {
      label: "Skonfiguruj płatności",
      href: `${base}/payments`,
      done:
        onlinePayments ||
        (!!checkout && ((checkout.transferEnabled ? !!checkout.bankAccount : false) || !!checkout.codEnabled)),
    },
    {
      label: "Uzupełnij dane do dokumentów",
      href: `${base}/legal`,
      // Dokumenty składają się same, więc „gotowe" nie znaczy „ktoś wkleił
      // tekst", tylko „nie zostały w nich luki po brakujących danych".
      done: terms?.mode === "custom" ? !!terms.content?.trim() : legalComplete,
    },
    { label: "Dodaj dane „O nas” i kontakt", href: `${base}/about`, done: !!(about?.content?.trim() || about?.email?.trim()) },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  const allDone = doneCount === steps.length;
  const pct = Math.round((doneCount / steps.length) * 100);

  const gmv30 = parseFloat(agg30[0]?.gmv ?? "0") || 0;
  const orders30 = agg30[0]?.total ?? 0;

  // Najpierw to, co wymaga ruchu dziś (do obsługi, nieopłacone), potem
  // liczby sprzedażowe. Magenta tylko wtedy, gdy jest co zrobić.
  const tiles = [
    { label: "Do obsługi", value: String(toShip), hint: "nowe i w realizacji", href: `${base}/orders`, accent: toShip > 0 },
    { label: "Czeka na płatność", value: String(unpaid), hint: "online anulujemy po 48 h", href: `${base}/orders`, accent: unpaid > 0 },
    { label: "Sprzedaż, 30 dni", value: pln(gmv30), hint: "bez anulowanych", href: `${base}/stats`, accent: false },
    { label: "Zamówienia, 30 dni", value: String(orders30), hint: "bez anulowanych", href: `${base}/stats`, accent: false },
  ];

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-6xl mx-auto">
      {/* Greeting */}
      <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--panel-ink)]" style={{ fontFamily: "var(--font-display)" }}>
            Cześć, {shopName}
          </h1>
          <p className="text-[13.5px] mt-1 text-[var(--panel-ink-muted)]">Oto co dzieje się dziś w Twoim sklepie.</p>
        </div>
        <Link
          href={`/${shopSlug}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 h-9 px-3.5 rounded-lg text-[13px] font-medium border border-[var(--panel-border)] bg-[var(--panel-surface)] text-[var(--panel-ink)] hover:border-[var(--panel-border-strong)] transition-colors"
        >
          <Eye className="w-4 h-4 text-[var(--panel-ink-muted)]" strokeWidth={1.75} />
          Zobacz sklep
        </Link>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {tiles.map((t) => (
          <Link
            key={t.label}
            href={t.href}
            className={[
              "rounded-xl p-4 border bg-[var(--panel-surface)] transition-colors flex flex-col gap-1.5",
              t.accent
                ? "border-[color-mix(in_oklch,var(--panel-accent)_45%,transparent)] hover:border-[var(--panel-accent)]"
                : "border-[var(--panel-border)] hover:border-[var(--panel-border-strong)]",
            ].join(" ")}
          >
            <span className="text-[12.5px] font-medium text-[var(--panel-ink-muted)] flex items-center gap-2">
              {t.accent && <span aria-hidden className="w-1.5 h-1.5 rounded-full bg-[var(--panel-accent)]" />}
              {t.label}
            </span>
            <span
              className={["text-[26px] font-semibold tabular-nums leading-none", t.accent ? "text-[var(--panel-accent)]" : "text-[var(--panel-ink)]"].join(" ")}
              style={{ fontFamily: "var(--font-display)" }}
            >
              {t.value}
            </span>
            <span className="text-[12px] text-[var(--panel-ink-faint)]">{t.hint}</span>
          </Link>
        ))}
      </div>

      {/* Setup checklist */}
      {!allDone && (
        <div className="rounded-xl p-5 mb-6 border border-[var(--panel-border)] bg-[var(--panel-surface)]">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[15px] font-semibold text-[var(--panel-ink)]" style={{ fontFamily: "var(--font-display)" }}>
              Skonfiguruj swój sklep
            </h2>
            <span className="text-[12.5px] font-medium tabular-nums text-[var(--panel-ink-muted)]">
              {doneCount} z {steps.length}
            </span>
          </div>
          <div className="h-1.5 rounded-full mb-4 overflow-hidden bg-[var(--panel-surface-2)]">
            <div className="h-full rounded-full transition-all bg-[var(--panel-primary)]" style={{ width: `${pct}%` }} />
          </div>

          <div className="grid sm:grid-cols-2 gap-1.5">
            {steps.map((s) => (
              <Link
                key={s.label}
                href={s.href}
                className="group flex items-center gap-3 px-3 h-10 rounded-lg transition-colors hover:bg-[var(--panel-surface-hover)]"
              >
                <span
                  className={[
                    "w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0",
                    s.done ? "bg-[var(--panel-success)] text-white" : "border-[1.5px] border-[var(--panel-border-strong)]",
                  ].join(" ")}
                >
                  {s.done && <Check className="w-3 h-3" strokeWidth={3} />}
                </span>
                <span
                  className={[
                    "text-[13.5px] flex-1",
                    s.done ? "text-[var(--panel-ink-faint)] line-through" : "text-[var(--panel-ink)] font-medium",
                  ].join(" ")}
                >
                  {s.label}
                </span>
                {!s.done && (
                  <ArrowRight className="w-4 h-4 shrink-0 text-[var(--panel-ink-faint)] group-hover:text-[var(--panel-ink)] transition-colors" strokeWidth={1.75} />
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-[1.6fr_1fr] gap-6 items-start">
        {/* Recent orders */}
        <div className="rounded-xl overflow-hidden border border-[var(--panel-border)] bg-[var(--panel-surface)]">
          <div className="flex items-center justify-between px-5 h-12 border-b border-[var(--panel-border)]">
            <h2 className="text-[15px] font-semibold text-[var(--panel-ink)]" style={{ fontFamily: "var(--font-display)" }}>
              Ostatnie zamówienia
            </h2>
            <Link href={`${base}/orders`} className="text-[13px] font-medium text-[var(--panel-primary)] hover:underline">
              Wszystkie
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="px-5 py-10 text-sm text-center text-[var(--panel-ink-muted)]">
              Brak zamówień. Pojawią się tu po pierwszym zakupie.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--panel-border)]">
              {recent.map((o) => {
                const st = STATUS_STYLES[o.status] ?? STATUS_STYLES.pending;
                return (
                  <li key={o.id}>
                    <Link
                      href={`${base}/orders/${o.id}`}
                      className="flex items-center gap-4 px-5 h-[52px] transition-colors hover:bg-[var(--panel-surface-hover)]"
                    >
                      <span className="text-[12.5px] font-medium text-[var(--panel-primary)] w-[88px] shrink-0" style={{ fontFamily: "var(--font-mono)" }}>
                        {o.orderNumber}
                      </span>
                      <span className="text-[13.5px] font-medium text-[var(--panel-ink)] truncate flex-1 min-w-0">
                        {o.customerName ?? "—"}
                      </span>
                      <span className="hidden sm:flex items-center gap-2 text-[13px] text-[var(--panel-ink-muted)] w-[118px] shrink-0">
                        <span aria-hidden className="w-2 h-2 rounded-full shrink-0" style={{ background: st.dot }} />
                        {st.label}
                      </span>
                      <span className="text-[13.5px] font-semibold tabular-nums text-[var(--panel-ink)] shrink-0 text-right w-[92px]">
                        {pln(parseFloat(o.total))}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Quick actions */}
        <div className="rounded-xl p-5 border border-[var(--panel-border)] bg-[var(--panel-surface)]">
          <h2 className="text-[15px] font-semibold mb-4 text-[var(--panel-ink)]" style={{ fontFamily: "var(--font-display)" }}>
            Szybkie akcje
          </h2>
          <div className="flex flex-col gap-2">
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
      className={[
        "flex items-center gap-2.5 px-3.5 h-10 rounded-lg text-[13.5px] font-medium transition-colors",
        primary
          ? "bg-[var(--panel-accent)] text-white hover:opacity-90"
          : "border border-[var(--panel-border)] text-[var(--panel-ink)] hover:border-[var(--panel-border-strong)] hover:bg-[var(--panel-surface-hover)]",
      ].join(" ")}
    >
      <Icon className={["w-4 h-4 shrink-0", primary ? "" : "text-[var(--panel-ink-muted)]"].join(" ")} strokeWidth={1.75} />
      {label}
    </Link>
  );
}
