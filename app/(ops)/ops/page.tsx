import Link from "next/link";
import { db } from "@/lib/db";
import { shops, users, orders, products } from "@/lib/db/schema";
import { eq, desc, count } from "drizzle-orm";

/**
 * Ops overview: rough platform-level pulse. Values are server-rendered on
 * each request (small DB, no caching needed yet). MRR is stubbed until we
 * wire Stripe — most early shops will be on `free` anyway.
 */
export default async function OpsOverviewPage() {
  const [shopCounts, userCount, productCount, orderCount, latestShops] = await Promise.all([
    db.select({
      total: count(),
      active: count(shops.active),
    }).from(shops),
    db.select({ total: count() }).from(users),
    db.select({ total: count() }).from(products),
    db.select({ total: count() }).from(orders),
    db.query.shops.findMany({
      orderBy: [desc(shops.createdAt)],
      limit: 5,
      with: { owner: { columns: { email: true, name: true } } },
    }),
  ]);

  const stats = [
    { label: "Sklepy", value: shopCounts[0]?.total ?? 0, hint: `${shopCounts[0]?.active ?? 0} aktywnych` },
    { label: "Użytkownicy", value: userCount[0]?.total ?? 0, hint: "" },
    { label: "Produkty", value: productCount[0]?.total ?? 0, hint: "" },
    { label: "Zamówienia", value: orderCount[0]?.total ?? 0, hint: "" },
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
              className="text-3xl font-bold tabular-nums"
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

      {/* ── Latest shops ────────────────────────────────────────── */}
      <section
        className="rounded-2xl overflow-hidden"
        style={{ background: "var(--brand-paper)", border: "1px solid var(--brand-rule)" }}
      >
        <header
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--brand-rule)" }}
        >
          <h2
            className="text-base font-semibold tracking-tight"
            style={{ fontFamily: "var(--font-display)", color: "var(--brand-ink)" }}
          >
            Najnowsze sklepy
          </h2>
          <Link
            href="/ops/shops"
            className="text-xs font-medium hover:underline"
            style={{ color: "var(--brand-ink-2)", fontFamily: "var(--font-mono)" }}
          >
            Zobacz wszystkie →
          </Link>
        </header>
        {latestShops.length === 0 ? (
          <p className="px-5 py-8 text-sm text-center" style={{ color: "var(--brand-ink-2)" }}>
            Jeszcze nikt nie założył sklepu.
          </p>
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
      </section>
    </div>
  );
}
