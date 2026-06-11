import Link from "next/link";
import { db } from "@/lib/db";
import { shops, users, orders, products } from "@/lib/db/schema";
import { desc, count, gte, ne, and, sum, eq, sql } from "drizzle-orm";

const pln = (v: string | number | null) =>
  `${(typeof v === "string" ? parseFloat(v) : v ?? 0).toFixed(2).replace(".", ",")} zł`;

/**
 * Ops overview: platform pulse. Server-rendered per request (small DB, no
 * caching needed yet). GMV = sum of non-cancelled order totals. MRR comes
 * once Stripe billing lands — early shops are on `free` anyway.
 */
export default async function OpsOverviewPage() {
  const now = Date.now();
  const d7 = new Date(now - 7 * 24 * 3600 * 1000);
  const d30 = new Date(now - 30 * 24 * 3600 * 1000);
  const notCancelled = ne(orders.status, "cancelled");

  const [
    shopCounts,
    newShops7,
    newShops30,
    userCount,
    productCount,
    ordersTotal,
    orders30,
    topShops,
    deadShops,
    latestShops,
  ] = await Promise.all([
    db.select({ total: count(), active: count(shops.active) }).from(shops),
    db.select({ total: count() }).from(shops).where(gte(shops.createdAt, d7)),
    db.select({ total: count() }).from(shops).where(gte(shops.createdAt, d30)),
    db.select({ total: count() }).from(users),
    db.select({ total: count() }).from(products),
    db.select({ total: count(), gmv: sum(orders.total) }).from(orders).where(notCancelled),
    db
      .select({ total: count(), gmv: sum(orders.total) })
      .from(orders)
      .where(and(notCancelled, gte(orders.createdAt, d30))),
    db
      .select({
        shopId: orders.shopId,
        name: shops.name,
        slug: shops.slug,
        orderCount: count(),
        gmv: sum(orders.total),
      })
      .from(orders)
      .innerJoin(shops, eq(shops.id, orders.shopId))
      .where(notCancelled)
      .groupBy(orders.shopId, shops.name, shops.slug)
      .orderBy(desc(sum(orders.total)))
      .limit(5),
    db
      .select({ id: shops.id, name: shops.name, slug: shops.slug, createdAt: shops.createdAt })
      .from(shops)
      .leftJoin(products, eq(products.shopId, shops.id))
      .groupBy(shops.id)
      .having(sql`count(${products.id}) = 0`)
      .orderBy(desc(shops.createdAt))
      .limit(8),
    db.query.shops.findMany({
      orderBy: [desc(shops.createdAt)],
      limit: 5,
      with: { owner: { columns: { email: true, name: true } } },
    }),
  ]);

  const stats = [
    {
      label: "Sklepy",
      value: shopCounts[0]?.total ?? 0,
      hint: `+${newShops7[0]?.total ?? 0} w 7 dni · +${newShops30[0]?.total ?? 0} w 30 dni`,
    },
    {
      label: "GMV (30 dni)",
      value: pln(orders30[0]?.gmv ?? 0),
      hint: `łącznie ${pln(ordersTotal[0]?.gmv ?? 0)}`,
    },
    {
      label: "Zamówienia (30 dni)",
      value: orders30[0]?.total ?? 0,
      hint: `łącznie ${ordersTotal[0]?.total ?? 0}`,
    },
    {
      label: "Użytkownicy",
      value: userCount[0]?.total ?? 0,
      hint: `${productCount[0]?.total ?? 0} produktów na platformie`,
    },
  ];

  return (
    <div className="space-y-10 max-w-5xl">
      <header>
        <p
          className="text-[11px] font-semibold uppercase tracking-[0.18em] mb-2"
          style={{ color: "var(--brand-ink-2)", fontFamily: "var(--font-mono)" }}
        >
          Operator · panel
        </p>
        <h1
          className="text-3xl font-bold tracking-tight"
          style={{ fontFamily: "var(--font-display)", color: "var(--brand-ink)" }}
        >
          Co dzieje się w platformie
        </h1>
      </header>

      {/* ── Stat tiles ──────────────────────────────────────────── */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl p-5"
            style={{
              background: "var(--brand-paper)",
              border: "1px solid var(--brand-rule)",
            }}
          >
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.18em] mb-2"
              style={{ color: "var(--brand-ink-2)", fontFamily: "var(--font-mono)" }}
            >
              {s.label}
            </p>
            <p
              className="text-2xl font-bold tabular-nums"
              style={{ fontFamily: "var(--font-display)", color: "var(--brand-ink)" }}
            >
              {s.value}
            </p>
            {s.hint && (
              <p className="text-xs mt-1" style={{ color: "var(--brand-ink-2)" }}>
                {s.hint}
              </p>
            )}
          </div>
        ))}
      </section>

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        {/* ── Top shops by GMV ─────────────────────────────────── */}
        <Panel title="Top sklepy wg sprzedaży">
          {topShops.length === 0 ? (
            <Empty>Jeszcze żadnych zamówień.</Empty>
          ) : (
            <ul>
              {topShops.map((s, i) => (
                <li
                  key={s.shopId}
                  className="flex items-center justify-between px-5 py-3"
                  style={{ borderTop: "1px solid var(--brand-rule)" }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="text-[11px] w-5 shrink-0"
                      style={{ color: "var(--brand-ink-2)", fontFamily: "var(--font-mono)" }}
                    >
                      {i + 1}.
                    </span>
                    <div className="min-w-0">
                      <Link
                        href={`/ops/shops/${s.slug}`}
                        className="text-sm font-semibold hover:underline block truncate"
                        style={{ color: "var(--brand-ink)" }}
                      >
                        {s.name}
                      </Link>
                      <p
                        className="text-[11px]"
                        style={{ color: "var(--brand-ink-2)", fontFamily: "var(--font-mono)" }}
                      >
                        {s.orderCount} zam.
                      </p>
                    </div>
                  </div>
                  <p
                    className="text-sm font-bold tabular-nums shrink-0"
                    style={{ color: "var(--brand-ink)" }}
                  >
                    {pln(s.gmv)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {/* ── Dead shops (no products) ─────────────────────────── */}
        <Panel title="Sklepy bez produktów" hint="kandydaci do kontaktu">
          {deadShops.length === 0 ? (
            <Empty>Każdy sklep ma już produkty 🎉</Empty>
          ) : (
            <ul>
              {deadShops.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between px-5 py-3"
                  style={{ borderTop: "1px solid var(--brand-rule)" }}
                >
                  <Link
                    href={`/ops/shops/${s.slug}`}
                    className="text-sm font-semibold hover:underline truncate"
                    style={{ color: "var(--brand-ink)" }}
                  >
                    {s.name}
                  </Link>
                  <p
                    className="text-[11px] shrink-0"
                    style={{ color: "var(--brand-ink-2)", fontFamily: "var(--font-mono)" }}
                  >
                    zał. {new Date(s.createdAt).toLocaleDateString("pl-PL")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {/* ── Latest shops ────────────────────────────────────────── */}
      <Panel
        title="Najnowsze sklepy"
        action={
          <Link
            href="/ops/shops"
            className="text-xs font-medium hover:underline"
            style={{ color: "var(--brand-ink-2)", fontFamily: "var(--font-mono)" }}
          >
            Zobacz wszystkie →
          </Link>
        }
      >
        {latestShops.length === 0 ? (
          <Empty>Jeszcze nikt nie założył sklepu.</Empty>
        ) : (
          <ul>
            {latestShops.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between px-5 py-3"
                style={{ borderTop: "1px solid var(--brand-rule)" }}
              >
                <div>
                  <Link
                    href={`/ops/shops/${s.slug}`}
                    className="text-sm font-semibold hover:underline"
                    style={{ color: "var(--brand-ink)" }}
                  >
                    {s.name}
                  </Link>
                  <p
                    className="text-[11px] mt-0.5"
                    style={{ color: "var(--brand-ink-2)", fontFamily: "var(--font-mono)" }}
                  >
                    {s.slug} · {s.owner.email}
                  </p>
                </div>
                <p
                  className="text-[11px]"
                  style={{ color: "var(--brand-ink-2)", fontFamily: "var(--font-mono)" }}
                >
                  {new Date(s.createdAt).toLocaleDateString("pl-PL")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

/* ── small atoms ───────────────────────────────────────────────── */

function Panel({
  title,
  hint,
  action,
  children,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      className="rounded-2xl overflow-hidden"
      style={{ background: "var(--brand-paper)", border: "1px solid var(--brand-rule)" }}
    >
      <header
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: "1px solid var(--brand-rule)" }}
      >
        <div className="flex items-baseline gap-2">
          <h2
            className="text-base font-semibold tracking-tight"
            style={{ fontFamily: "var(--font-display)", color: "var(--brand-ink)" }}
          >
            {title}
          </h2>
          {hint && (
            <span className="text-[11px]" style={{ color: "var(--brand-ink-2)" }}>
              {hint}
            </span>
          )}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-5 py-8 text-sm text-center" style={{ color: "var(--brand-ink-2)" }}>
      {children}
    </p>
  );
}
