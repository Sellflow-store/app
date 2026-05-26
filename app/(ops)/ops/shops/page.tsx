import Link from "next/link";
import { db } from "@/lib/db";
import { shops, products } from "@/lib/db/schema";
import { desc, eq, ilike, or, count, sql } from "drizzle-orm";
import { ArrowUpRight, Search } from "lucide-react";

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

/**
 * Every shop on the platform, newest first. Search filters by slug or name
 * (case-insensitive). Each row is a link to /ops/shops/[slug] for detail +
 * the "act as owner" path that uses the admin role bypass in getShopAccess.
 */
export default async function OpsShopsPage({ searchParams }: PageProps) {
  const { q = "" } = await searchParams;
  const term = q.trim();

  const where = term
    ? or(ilike(shops.slug, `%${term}%`), ilike(shops.name, `%${term}%`))
    : undefined;

  const rows = await db
    .select({
      id: shops.id,
      slug: shops.slug,
      name: shops.name,
      active: shops.active,
      createdAt: shops.createdAt,
      ownerEmail: sql<string>`(SELECT email FROM users WHERE id = ${shops.ownerId})`,
      ownerPlan: sql<string>`(SELECT plan FROM users WHERE id = ${shops.ownerId})`,
      productCount: sql<number>`(SELECT COUNT(*)::int FROM products WHERE shop_id = ${shops.id})`,
    })
    .from(shops)
    .where(where)
    .orderBy(desc(shops.createdAt));

  return (
    <div className="space-y-6 max-w-5xl">
      <header>
        <p
          className="text-[11px] font-semibold uppercase tracking-[0.18em] mb-2"
          style={{ color: "var(--brand-ink-2)", fontFamily: "var(--font-mono)" }}
        >
          Operator · sklepy
        </p>
        <h1
          className="text-3xl font-bold tracking-tight"
          style={{ fontFamily: "var(--font-display)", color: "var(--brand-ink)" }}
        >
          Sklepy ({rows.length})
        </h1>
      </header>

      {/* ── Search ──────────────────────────────────────────────── */}
      <form method="GET" className="relative max-w-md">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
          style={{ color: "var(--brand-ink-2)" }}
          strokeWidth={1.75}
        />
        <input
          name="q"
          defaultValue={q}
          placeholder="Szukaj po nazwie lub adresie..."
          className="w-full text-sm rounded-xl focus:outline-none transition-colors"
          style={{
            padding: "10px 14px 10px 36px",
            background: "var(--brand-paper)",
            color: "var(--brand-ink)",
            border: "1.5px solid var(--brand-rule)",
            fontFamily: "var(--font-body)",
          }}
        />
      </form>

      {/* ── Table ───────────────────────────────────────────────── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "var(--brand-paper)", border: "1px solid var(--brand-rule)" }}
      >
        {rows.length === 0 ? (
          <p className="px-5 py-10 text-sm text-center" style={{ color: "var(--brand-ink-2)" }}>
            {term ? "Brak wyników." : "Jeszcze nikt nie założył sklepu."}
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid var(--brand-rule)",
                  background: "var(--brand-paper-3)",
                }}
              >
                <Th>Sklep</Th>
                <Th>Właściciel</Th>
                <Th>Plan</Th>
                <Th>Produkty</Th>
                <Th>Status</Th>
                <Th>Utworzono</Th>
                <Th aria-label="Akcje" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  style={{ borderBottom: "1px solid var(--brand-rule)" }}
                  className="transition-colors hover:bg-[var(--brand-paper-2)]"
                >
                  <Td>
                    <Link
                      href={`/ops/shops/${r.slug}`}
                      className="font-semibold hover:underline"
                      style={{ color: "var(--brand-ink)" }}
                    >
                      {r.name}
                    </Link>
                    <div
                      className="text-[11px] mt-0.5"
                      style={{ color: "var(--brand-ink-2)", fontFamily: "var(--font-mono)" }}
                    >
                      {r.slug}
                    </div>
                  </Td>
                  <Td>
                    <span style={{ color: "var(--brand-ink-2)" }}>{r.ownerEmail}</span>
                  </Td>
                  <Td>
                    <PlanPill plan={r.ownerPlan} />
                  </Td>
                  <Td>
                    <span className="tabular-nums" style={{ color: "var(--brand-ink-2)" }}>
                      {r.productCount}
                    </span>
                  </Td>
                  <Td>
                    {r.active ? (
                      <StatusPill label="Aktywny" color="success" />
                    ) : (
                      <StatusPill label="Wyłączony" color="muted" />
                    )}
                  </Td>
                  <Td>
                    <span
                      className="text-[11px]"
                      style={{ color: "var(--brand-ink-2)", fontFamily: "var(--font-mono)" }}
                    >
                      {new Date(r.createdAt).toLocaleDateString("pl-PL")}
                    </span>
                  </Td>
                  <Td>
                    <Link
                      href={`/ops/shops/${r.slug}`}
                      className="inline-flex items-center"
                      style={{ color: "var(--brand-ink-2)" }}
                      aria-label={`Szczegóły ${r.name}`}
                    >
                      <ArrowUpRight className="w-4 h-4" strokeWidth={1.75} />
                    </Link>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Th({ children, ...rest }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className="text-left text-[10px] font-semibold uppercase tracking-[0.14em] px-5 py-3"
      style={{ color: "var(--brand-ink-2)", fontFamily: "var(--font-mono)" }}
      {...rest}
    >
      {children}
    </th>
  );
}

function Td({ children }: { children?: React.ReactNode }) {
  return <td className="px-5 py-3 align-middle">{children}</td>;
}

function PlanPill({ plan }: { plan: string }) {
  const colorMap: Record<string, string> = {
    free: "var(--brand-paper-3)",
    starter: "var(--brand-aqua-2)",
    pro: "var(--brand-accent)",
  };
  const isPro = plan === "pro";
  return (
    <span
      className="inline-flex items-center text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full"
      style={{
        background: colorMap[plan] ?? "var(--brand-paper-3)",
        color: isPro ? "var(--brand-on-accent)" : "var(--brand-ink)",
        fontFamily: "var(--font-mono)",
      }}
    >
      {plan}
    </span>
  );
}

function StatusPill({ label, color }: { label: string; color: "success" | "muted" }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] font-medium"
      style={{ color: color === "success" ? "var(--brand-success)" : "var(--brand-ink-2)" }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{
          background:
            color === "success" ? "var(--brand-success)" : "var(--brand-ink-2)",
        }}
      />
      {label}
    </span>
  );
}
