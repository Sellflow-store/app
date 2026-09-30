import Link from "next/link";
import { ArrowUpRight, Download, Search } from "lucide-react";
import {
  OPS_PLANS,
  countOpsShops,
  loadOpsShops,
  opsShopStatus,
  parseOpsShopFilter,
  type OpsShopFilter,
  type OpsShopSort,
} from "@/lib/ops-shops";
import RestoreButton from "./RestoreButton";

interface PageProps {
  searchParams: Promise<{ q?: string; widok?: string; plan?: string; sort?: string }>;
}

const pln = (v: number) => `${v.toFixed(2).replace(".", ",")} zł`;
const day = (d: Date | null) => (d ? d.toLocaleDateString("pl-PL") : "—");

/**
 * Every shop on the platform, split into two tabs: live shops (anything not
 * soft-deleted, incl. suspended/disabled) and deleted ones (?widok=usuniete).
 * Search matches slug, name or owner e-mail; plan filter and sortable columns
 * (GMV 30 dni, ostatnie zamówienie, produkty, aktywność właściciela) work
 * within the current tab. The same filter drives the CSV export. Each row
 * links to /ops/shops/[slug] for detail + the "act as owner" path.
 */
export default async function OpsShopsPage({ searchParams }: PageProps) {
  const f = parseOpsShopFilter(await searchParams);
  const [rows, tabCounts] = await Promise.all([loadOpsShops(f), countOpsShops(f)]);

  return (
    <div className="space-y-6 max-w-7xl">
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
          Sklepy ({tabCounts.live})
        </h1>
      </header>

      {/* ── Tabs ────────────────────────────────────────────────── */}
      <nav className="flex gap-1" aria-label="Widok listy sklepów">
        <TabLink href={listHref(f, { deleted: false })} active={!f.deleted} label="Aktywne" count={tabCounts.live} />
        <TabLink href={listHref(f, { deleted: true })} active={f.deleted} label="Usunięte" count={tabCounts.deleted} />
      </nav>

      {/* ── Filters ─────────────────────────────────────────────── */}
      <form method="GET" className="flex flex-wrap items-center gap-3">
        {f.deleted && <input type="hidden" name="widok" value="usuniete" />}
        {f.sort !== "created" && <input type="hidden" name="sort" value={f.sort} />}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
            style={{ color: "var(--brand-ink-2)" }}
            strokeWidth={1.75}
          />
          <input
            name="q"
            defaultValue={f.term}
            placeholder="Szukaj po nazwie, adresie lub e-mailu..."
            className="w-full text-sm rounded-xl focus:outline-none transition-colors"
            style={{
              padding: "10px 14px 10px 36px",
              background: "var(--brand-paper)",
              color: "var(--brand-ink)",
              border: "1.5px solid var(--brand-rule)",
              fontFamily: "var(--font-body)",
            }}
          />
        </div>
        <select
          name="plan"
          defaultValue={f.plan ?? ""}
          aria-label="Plan"
          className="text-sm rounded-xl focus:outline-none"
          style={{
            padding: "10px 12px",
            background: "var(--brand-paper)",
            color: "var(--brand-ink)",
            border: "1.5px solid var(--brand-rule)",
          }}
        >
          <option value="">Wszystkie plany</option>
          {OPS_PLANS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="text-sm font-medium rounded-xl px-4 py-2.5"
          style={{ background: "var(--brand-ink)", color: "var(--brand-on-ink)" }}
        >
          Filtruj
        </button>
        <a
          href={exportHref(f)}
          className="ml-auto inline-flex items-center gap-1.5 text-sm font-medium rounded-xl px-4 py-2.5"
          style={{ border: "1.5px solid var(--brand-rule)", color: "var(--brand-ink)" }}
        >
          <Download className="w-4 h-4" strokeWidth={1.75} />
          Eksport CSV
        </a>
      </form>

      {/* ── Table ───────────────────────────────────────────────── */}
      <div
        className="rounded-2xl overflow-x-auto"
        style={{ background: "var(--brand-paper)", border: "1px solid var(--brand-rule)" }}
      >
        {rows.length === 0 ? (
          <p className="px-5 py-10 text-sm text-center" style={{ color: "var(--brand-ink-2)" }}>
            {f.term || f.plan
              ? "Brak wyników."
              : f.deleted
                ? "Brak usuniętych sklepów."
                : "Jeszcze nikt nie założył sklepu."}
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
                <SortTh f={f} sort="products">Produkty</SortTh>
                <SortTh f={f} sort="gmv">GMV 30 dni</SortTh>
                <SortTh f={f} sort="last_order">Ostatnie zam.</SortTh>
                <SortTh f={f} sort="active">Aktywność właśc.</SortTh>
                <Th>Status</Th>
                <SortTh f={f} sort="created">Utworzono</SortTh>
                <Th aria-label="Akcje" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const status = opsShopStatus(r);
                return (
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
                      <Num>{r.productCount}</Num>
                    </Td>
                    <Td>
                      <Num>{r.gmv30 > 0 ? pln(r.gmv30) : "—"}</Num>
                      {r.orders30 > 0 && (
                        <div className="text-[11px]" style={{ color: "var(--brand-ink-2)" }}>
                          {r.orders30} zam.
                        </div>
                      )}
                    </Td>
                    <Td>
                      <Mono>{day(r.lastOrderAt)}</Mono>
                    </Td>
                    <Td>
                      <Mono>{day(r.ownerActiveAt)}</Mono>
                    </Td>
                    <Td>
                      <StatusPill label={status} color={status === "Aktywny" ? "success" : "muted"} />
                    </Td>
                    <Td>
                      <Mono>{day(r.createdAt)}</Mono>
                    </Td>
                    <Td>
                      <div className="flex items-center justify-end gap-3">
                        {r.deletedAt && <RestoreButton slug={r.slug} shopName={r.name} />}
                        <Link
                          href={`/ops/shops/${r.slug}`}
                          className="inline-flex items-center"
                          style={{ color: "var(--brand-ink-2)" }}
                          aria-label={`Szczegóły ${r.name}`}
                        >
                          <ArrowUpRight className="w-4 h-4" strokeWidth={1.75} />
                        </Link>
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function listParams(f: OpsShopFilter, over: Partial<OpsShopFilter> = {}) {
  const v = { ...f, ...over };
  const params = new URLSearchParams();
  if (v.deleted) params.set("widok", "usuniete");
  if (v.term) params.set("q", v.term);
  if (v.plan) params.set("plan", v.plan);
  if (v.sort !== "created") params.set("sort", v.sort);
  return params.toString();
}

function listHref(f: OpsShopFilter, over: Partial<OpsShopFilter> = {}) {
  const qs = listParams(f, over);
  return qs ? `/ops/shops?${qs}` : "/ops/shops";
}

function exportHref(f: OpsShopFilter) {
  const qs = listParams(f);
  return qs ? `/api/ops/shops/export?${qs}` : "/api/ops/shops/export";
}

function TabLink({
  href,
  active,
  label,
  count,
}: {
  href: string;
  active: boolean;
  label: string;
  count: number;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className="inline-flex items-center gap-2 text-sm font-medium px-3.5 py-2 rounded-lg transition-colors"
      style={{
        background: active ? "var(--brand-paper)" : "transparent",
        color: active ? "var(--brand-ink)" : "var(--brand-ink-2)",
        border: `1px solid ${active ? "var(--brand-rule)" : "transparent"}`,
      }}
    >
      {label}
      <span
        className="text-[11px] tabular-nums px-1.5 py-0.5 rounded-md"
        style={{ background: "var(--brand-paper-3)", fontFamily: "var(--font-mono)" }}
      >
        {count}
      </span>
    </Link>
  );
}

const thClass = "text-left text-[10px] font-semibold uppercase tracking-[0.14em] px-4 py-3 whitespace-nowrap";
const thStyle = { color: "var(--brand-ink-2)", fontFamily: "var(--font-mono)" };

function Th({ children, ...rest }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className={thClass} style={thStyle} {...rest}>
      {children}
    </th>
  );
}

/** Nagłówek sortujący: kliknięcie ustawia sortowanie malejąco po kolumnie. */
function SortTh({ f, sort, children }: { f: OpsShopFilter; sort: OpsShopSort; children: React.ReactNode }) {
  const active = f.sort === sort;
  return (
    <th className={thClass} style={thStyle} aria-sort={active ? "descending" : undefined}>
      <Link
        href={listHref(f, { sort })}
        className="hover:underline"
        style={{ color: active ? "var(--brand-ink)" : undefined }}
      >
        {children}
        {active && " ↓"}
      </Link>
    </th>
  );
}

function Td({ children }: { children?: React.ReactNode }) {
  return <td className="px-4 py-3 align-middle whitespace-nowrap">{children}</td>;
}

function Num({ children }: { children: React.ReactNode }) {
  return (
    <span className="tabular-nums" style={{ color: "var(--brand-ink-2)" }}>
      {children}
    </span>
  );
}

function Mono({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px]" style={{ color: "var(--brand-ink-2)", fontFamily: "var(--font-mono)" }}>
      {children}
    </span>
  );
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
