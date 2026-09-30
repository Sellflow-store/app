import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { shops, shopConfig, products, orders } from "@/lib/db/schema";
import { and, count, desc, eq, gte, inArray, ne, sum } from "drizzle-orm";
import { getShopAccess } from "@/lib/api";
import { STATUS_STYLES } from "@/lib/order-status";
import { formatPln } from "@/lib/money";
import { tpayEnabled } from "@/lib/tpay-status";
import { catalogReadiness, shopSetupDone } from "@/lib/shop-setup";
import type { BrandingConfig } from "@/types/shop";
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

  const [shop, configRows, [{ products: productCount }], agg30, recent, [{ toShip }], [{ unpaid }], onlinePayments, productData] =
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
      db
        .select({
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
        .where(and(eq(products.shopId, access.shopId), eq(products.visible, true))),
    ]);

  // ── Gotowość katalogu dla Google i AI ────────────────────────────────────
  const { readyCount, topGaps } = catalogReadiness(productData);

  const configMap = Object.fromEntries(configRows.map((c) => [c.key, c.value]));
  const branding = configMap.branding as Partial<BrandingConfig> | undefined;
  const shopName = branding?.shopName || shop?.name || shopSlug;
  const done = shopSetupDone({ configMap, productCount, onlinePayments, shopName });

  // ── Setup checklist ──────────────────────────────────────────────────────
  // Kolejność = kolejność, w jakiej sklep zaczyna zarabiać: bez produktu,
  // płatności i dostawy nie ma zamówienia; bez dokumentów nie wolno sprzedawać;
  // logo i „O nas” podnoszą zaufanie, ale nie blokują pierwszej sprzedaży.
  const steps = [
    {
      label: "Dodaj pierwszy produkt",
      desc: "Nazwa, cena i zdjęcie wystarczą. Resztę uzupełnisz później.",
      cta: "Dodaj produkt",
      href: `${base}/products/new`,
      done: done.product,
    },
    {
      label: "Ustaw płatności",
      desc: "Podłącz Tpay (BLIK, karty) albo włącz przelew lub pobranie.",
      cta: "Ustaw płatności",
      href: `${base}/payments`,
      done: done.payments,
    },
    {
      label: "Ustaw dostawę",
      desc: "Wybierz, jak wysyłasz, i ile to kosztuje klienta.",
      cta: "Ustaw dostawę",
      href: `${base}/delivery`,
      done: done.delivery,
    },
    {
      label: "Uzupełnij dane do dokumentów",
      desc: "Regulamin i polityka prywatności złożą się same z danych Twojej firmy.",
      cta: "Uzupełnij dane",
      href: `${base}/legal`,
      done: done.legal,
    },
    {
      label: "Wgraj logo",
      desc: "Pojawi się w menu sklepu, w mailach i na karcie przeglądarki.",
      cta: "Wgraj logo",
      href: `${base}/branding`,
      done: done.logo,
    },
    {
      label: "Napisz kilka zdań o marce",
      desc: "Strona „O nas” i kontakt. Klienci sprawdzają ją przed pierwszym zakupem.",
      cta: "Uzupełnij „O nas”",
      href: `${base}/about`,
      done: done.about,
    },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  const allDone = doneCount === steps.length;
  const pct = Math.round((doneCount / steps.length) * 100);
  const nextStep = steps.find((s) => !s.done);

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
          <p className="text-[13.5px] mt-1 text-[var(--panel-ink-muted)]">
            {allDone
              ? "Oto co dzieje się dziś w Twoim sklepie."
              : `Do uruchomienia sklepu ${stepsLeftLabel(steps.length - doneCount)}.`}
          </p>
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

      {/* Uruchomienie sklepu: dopóki coś zostało, to jest pierwsza rzecz na
          pulpicie, z jednym wyraźnym następnym krokiem zamiast listy do wyboru. */}
      {!allDone && nextStep && (
        <section className="rounded-xl mb-6 border border-[var(--panel-border)] bg-[var(--panel-surface)] overflow-hidden">
          <div className="px-5 pt-5 pb-4">
            <div className="flex items-center justify-between gap-4 mb-2">
              <h2 className="text-[15px] font-semibold text-[var(--panel-ink)]" style={{ fontFamily: "var(--font-display)" }}>
                Uruchom sklep
              </h2>
              <span className="text-[12.5px] font-medium tabular-nums text-[var(--panel-ink-muted)]">
                {doneCount} z {steps.length} gotowe
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden bg-[var(--panel-surface-2)]">
              <div className="h-full rounded-full transition-all bg-[var(--panel-primary)]" style={{ width: `${pct}%` }} />
            </div>
          </div>

          <div className="mx-5 mb-4 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-3 bg-[var(--panel-primary-soft)]">
            <div className="flex-1 min-w-0">
              <p className="text-[11.5px] font-semibold uppercase tracking-[0.06em] text-[var(--panel-ink-muted)]">
                Następny krok
              </p>
              <p className="text-[15px] font-semibold mt-0.5 text-[var(--panel-ink)]">{nextStep.label}</p>
              <p className="text-[13px] mt-0.5 text-[var(--panel-ink-muted)]">{nextStep.desc}</p>
            </div>
            <Link
              href={nextStep.href}
              className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg text-[13px] font-semibold bg-[var(--panel-accent)] text-white hover:opacity-90 transition-opacity shrink-0"
            >
              {nextStep.cta}
              <ArrowRight className="w-4 h-4" strokeWidth={2} />
            </Link>
          </div>

          <ol className="border-t border-[var(--panel-border)] divide-y divide-[var(--panel-border)]">
            {steps.map((s, i) => (
              <li key={s.label}>
                <Link
                  href={s.href}
                  className="group flex items-center gap-3 px-5 min-h-11 py-2 transition-colors hover:bg-[var(--panel-surface-hover)]"
                >
                  <span
                    className={[
                      "w-[20px] h-[20px] rounded-full flex items-center justify-center shrink-0 text-[11px] font-semibold tabular-nums",
                      s.done
                        ? "bg-[var(--panel-success-strong)] text-white"
                        : s === nextStep
                          ? "border-[1.5px] border-[var(--panel-primary)] text-[var(--panel-primary)]"
                          : "border-[1.5px] border-[var(--panel-border-strong)] text-[var(--panel-ink-faint)]",
                    ].join(" ")}
                  >
                    {s.done ? <Check className="w-3 h-3" strokeWidth={3} /> : i + 1}
                  </span>
                  <span className={["text-[13.5px] flex-1", s.done ? "text-[var(--panel-ink-muted)]" : "text-[var(--panel-ink)] font-medium"].join(" ")}>
                    {s.label}
                  </span>
                  <span className="text-[12.5px] text-[var(--panel-ink-faint)] group-hover:text-[var(--panel-ink)] transition-colors">
                    {s.done ? "Zmień" : "Przejdź"}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

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

      {/* Gotowość katalogu dla Google i AI: pokazujemy, gdy są produkty
          i coś jest do poprawy, z liczbą produktów przy każdej luce. */}
      {productData.length > 0 && topGaps.length > 0 && (
        <Link
          href={`${base}/products`}
          className="group flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl p-5 mb-6 border border-[var(--panel-border)] bg-[var(--panel-surface)] hover:border-[var(--panel-border-strong)] transition-colors"
        >
          <div className="shrink-0">
            <p className="text-[12.5px] font-medium text-[var(--panel-ink-muted)]">Gotowość dla Google i AI</p>
            <p className="text-[26px] font-semibold tabular-nums leading-none mt-1.5 text-[var(--panel-ink)]" style={{ fontFamily: "var(--font-display)" }}>
              {readyCount}<span className="text-[15px] font-medium text-[var(--panel-ink-muted)]"> z {productData.length}</span>
            </p>
            <p className="text-[12px] mt-1 text-[var(--panel-ink-faint)]">produktów z kompletem danych</p>
          </div>
          <ul className="flex-1 min-w-0 space-y-1 sm:border-l sm:pl-5 border-[var(--panel-border)]">
            {topGaps.map((g) => (
              <li key={g.label} className="text-[13px] text-[var(--panel-ink)]">
                <span className="font-semibold tabular-nums">{g.count}</span>{" "}
                <span className="text-[var(--panel-ink-muted)]">{productsWord(g.count)} bez pola</span>{" "}
                <span className="font-medium">{g.label.toLowerCase()}</span>
              </li>
            ))}
          </ul>
          <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--panel-primary)] shrink-0">
            Uzupełnij
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" strokeWidth={1.75} />
          </span>
        </Link>
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
            <QuickAction href={`${base}/products/new`} icon={Plus} label="Dodaj produkt" primary={allDone} />
            <QuickAction href={`${base}/orders`} icon={ClipboardList} label="Zarządzaj zamówieniami" />
            <QuickAction href={`${base}/home`} icon={HomeIcon} label="Edytuj stronę główną" />
            <QuickAction href={`${base}/branding`} icon={Palette} label="Logo i kolorystyka" />
          </div>
        </div>
      </div>
    </div>
  );
}

function productsWord(n: number): string {
  if (n === 1) return "produkt";
  const few = n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14);
  return few ? "produkty" : "produktów";
}

function stepsLeftLabel(n: number): string {
  if (n === 1) return "został 1 krok";
  const few = n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14);
  return few ? `zostały ${n} kroki` : `zostało ${n} kroków`;
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
