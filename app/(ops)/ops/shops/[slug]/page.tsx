import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { shops, products, orders, shopConfig } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";
import { ArrowLeft, ExternalLink, LogIn } from "lucide-react";
import ShopActions from "./ShopActions";

interface PageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Single-shop detail for ops. Shows owner identity, plan, custom domain,
 * timestamps + product/order counts. Two operator actions:
 *   - "Otwórz storefront" — public storefront URL (no auth)
 *   - "Zaloguj jako właściciel" — open the merchant dashboard. Works
 *     because lib/api.ts/getShopAccess returns the shop for admin sessions
 *     regardless of ownership, so no impersonation token is needed.
 */
export default async function ShopDetailPage({ params }: PageProps) {
  const { slug } = await params;

  const shop = await db.query.shops.findFirst({
    where: eq(shops.slug, slug),
    with: { owner: true },
  });
  if (!shop) notFound();

  const [productCount, orderCount, brandingRow] = await Promise.all([
    db.select({ total: count() }).from(products).where(eq(products.shopId, shop.id)),
    db.select({ total: count() }).from(orders).where(eq(orders.shopId, shop.id)),
    db.query.shopConfig.findFirst({
      where: (c, { and, eq }) => and(eq(c.shopId, shop.id), eq(c.key, "branding")),
    }),
  ]);

  const branding = brandingRow?.value as
    | { shopName?: string; primaryColor?: string; accentColor?: string }
    | undefined;

  const storefrontUrl = `https://${shop.slug}.sell-flow.store`;

  return (
    <div className="max-w-4xl space-y-8">
      <Link
        href="/ops/shops"
        className="inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
        style={{ color: "var(--brand-ink-2)" }}
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
        Wszystkie sklepy
      </Link>

      <header className="flex items-start justify-between gap-6">
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl shrink-0"
            style={{
              background: branding?.primaryColor ?? "var(--brand-ink)",
            }}
          />
          <div>
            <h1
              className="text-3xl font-bold tracking-tight"
              style={{ fontFamily: "var(--font-display)", color: "var(--brand-ink)" }}
            >
              {shop.name}
            </h1>
            <p
              className="text-[11px] mt-1"
              style={{ color: "var(--brand-ink-2)", fontFamily: "var(--font-mono)" }}
            >
              {shop.slug}.sell-flow.store
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href={storefrontUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-semibold rounded-full px-4 py-2 transition-colors"
            style={{
              background: "var(--brand-paper-3)",
              color: "var(--brand-ink)",
              border: "1.5px solid var(--brand-rule)",
            }}
          >
            <ExternalLink className="w-4 h-4" strokeWidth={1.75} />
            Otwórz storefront
          </a>
          {!shop.deletedAt && (
            <Link
              href={`/dashboard/${shop.slug}/orders`}
              className="inline-flex items-center gap-1.5 text-sm font-semibold rounded-full px-4 py-2 transition-colors"
              style={{
                background: "var(--brand-accent)",
                color: "var(--brand-on-accent)",
              }}
            >
              <LogIn className="w-4 h-4" strokeWidth={1.75} />
              Zaloguj jako właściciel
            </Link>
          )}
        </div>
      </header>

      {/* ── Stat grid ─────────────────────────────────────────────── */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Produkty" value={productCount[0]?.total ?? 0} />
        <Stat label="Zamówienia" value={orderCount[0]?.total ?? 0} />
        <Stat label="Plan" value={shop.owner.plan ?? "free"} mono />
        <Stat
          label="Status"
          value={
            shop.deletedAt ? "Usunięty"
            : shop.suspended ? "Zawieszony"
            : shop.active ? "Aktywny"
            : "Wyłączony"
          }
          tone={shop.deletedAt || shop.suspended || !shop.active ? "muted" : "success"}
        />
      </section>

      {/* ── Operator actions ─────────────────────────────────────── */}
      <ShopActions
        slug={shop.slug}
        shopName={shop.name}
        suspended={shop.suspended}
        deleted={!!shop.deletedAt}
        plan={shop.owner.plan ?? "free"}
      />

      {/* ── Details ──────────────────────────────────────────────── */}
      <section
        className="rounded-2xl overflow-hidden"
        style={{ background: "var(--brand-paper)", border: "1px solid var(--brand-rule)" }}
      >
        <SectionHeader>Dane sklepu</SectionHeader>
        <Row label="Nazwa" value={shop.name} />
        <Row label="Adres" value={`${shop.slug}.sell-flow.store`} mono />
        <Row label="Własna domena" value={shop.customDomain ?? "—"} mono />
        <Row label="Utworzono" value={new Date(shop.createdAt).toLocaleString("pl-PL")} mono />
        <Row label="Ostatnia zmiana" value={new Date(shop.updatedAt).toLocaleString("pl-PL")} mono />
        {shop.deletedAt && (
          <Row label="Usunięto" value={new Date(shop.deletedAt).toLocaleString("pl-PL")} mono />
        )}
      </section>

      <section
        className="rounded-2xl overflow-hidden"
        style={{ background: "var(--brand-paper)", border: "1px solid var(--brand-rule)" }}
      >
        <SectionHeader>Właściciel</SectionHeader>
        <Row label="E-mail" value={shop.owner.email} mono />
        <Row label="Imię i nazwisko" value={shop.owner.name ?? "—"} />
        <Row label="Plan" value={shop.owner.plan ?? "free"} mono />
        <Row label="Stripe customer" value={shop.owner.stripeCustomerId ?? "—"} mono />
        <Row label="Zarejestrowany" value={new Date(shop.owner.createdAt).toLocaleString("pl-PL")} mono />
      </section>

      {branding && (
        <section
          className="rounded-2xl overflow-hidden"
          style={{ background: "var(--brand-paper)", border: "1px solid var(--brand-rule)" }}
        >
          <SectionHeader>Branding</SectionHeader>
          <Row
            label="Kolor ink"
            value={
              <span className="inline-flex items-center gap-2">
                <span
                  className="w-4 h-4 rounded-full inline-block"
                  style={{
                    background: branding.primaryColor,
                    border: "1px solid var(--brand-rule)",
                  }}
                />
                <span style={{ fontFamily: "var(--font-mono)" }}>{branding.primaryColor}</span>
              </span>
            }
          />
          <Row
            label="Kolor accent"
            value={
              <span className="inline-flex items-center gap-2">
                <span
                  className="w-4 h-4 rounded-full inline-block"
                  style={{
                    background: branding.accentColor,
                    border: "1px solid var(--brand-rule)",
                  }}
                />
                <span style={{ fontFamily: "var(--font-mono)" }}>{branding.accentColor}</span>
              </span>
            }
          />
        </section>
      )}
    </div>
  );
}

/* ── small atoms ───────────────────────────────────────────────── */

function Stat({
  label, value, mono, tone,
}: { label: string; value: React.ReactNode; mono?: boolean; tone?: "success" | "muted" }) {
  const valueColor =
    tone === "success" ? "var(--brand-success)"
    : tone === "muted" ? "var(--brand-ink-2)"
    : "var(--brand-ink)";
  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: "var(--brand-paper)", border: "1px solid var(--brand-rule)" }}
    >
      <p
        className="text-[10px] font-semibold uppercase tracking-[0.18em] mb-2"
        style={{ color: "var(--brand-ink-2)", fontFamily: "var(--font-mono)" }}
      >
        {label}
      </p>
      <p
        className="text-xl font-bold tabular-nums"
        style={{
          fontFamily: mono ? "var(--font-mono)" : "var(--font-display)",
          color: valueColor,
        }}
      >
        {value}
      </p>
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <header
      className="px-5 py-3"
      style={{
        borderBottom: "1px solid var(--brand-rule)",
        background: "var(--brand-paper-3)",
      }}
    >
      <h2
        className="text-[11px] font-semibold uppercase tracking-[0.18em]"
        style={{ color: "var(--brand-ink-2)", fontFamily: "var(--font-mono)" }}
      >
        {children}
      </h2>
    </header>
  );
}

function Row({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div
      className="grid grid-cols-[180px_1fr] gap-4 px-5 py-3"
      style={{ borderTop: "1px solid var(--brand-rule)" }}
    >
      <span
        className="text-xs font-medium"
        style={{ color: "var(--brand-ink-2)" }}
      >
        {label}
      </span>
      <span
        className="text-sm"
        style={{
          color: "var(--brand-ink)",
          fontFamily: mono ? "var(--font-mono)" : "var(--font-body)",
        }}
      >
        {value}
      </span>
    </div>
  );
}
