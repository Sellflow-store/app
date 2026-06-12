import { db } from "@/lib/db";
import { orders, customers } from "@/lib/db/schema";
import { and, desc, eq, gte, ne } from "drizzle-orm";
import { getShopAccess } from "@/lib/api";
import { BarChart2 } from "lucide-react";

const pln = (v: number) => `${v.toFixed(2).replace(".", ",")} zł`;

interface OrderItem {
  productId: string;
  name: string;
  price: string;
  qty: number;
}

export default async function StatsPage({
  params,
}: {
  params: Promise<{ shop: string }>;
}) {
  const { shop: shopSlug } = await params;

  let shopOrders: (typeof orders.$inferSelect)[] = [];
  let topCustomers: (typeof customers.$inferSelect)[] = [];

  try {
    const access = await getShopAccess(shopSlug);
    if (access) {
      const d90 = new Date(Date.now() - 90 * 24 * 3600 * 1000);
      [shopOrders, topCustomers] = await Promise.all([
        db
          .select()
          .from(orders)
          .where(
            and(
              eq(orders.shopId, access.shopId),
              ne(orders.status, "cancelled"),
              gte(orders.createdAt, d90)
            )
          )
          .orderBy(desc(orders.createdAt)),
        db
          .select()
          .from(customers)
          .where(eq(customers.shopId, access.shopId))
          .orderBy(desc(customers.totalSpent))
          .limit(5),
      ]);
    }
  } catch {
    // DB not configured yet — render empty state
  }

  const now = Date.now();
  const d30 = now - 30 * 24 * 3600 * 1000;

  const orders30 = shopOrders.filter((o) => o.createdAt.getTime() >= d30);
  const gmv30 = orders30.reduce((s, o) => s + parseFloat(o.total), 0);
  const gmv90 = shopOrders.reduce((s, o) => s + parseFloat(o.total), 0);
  const aov = orders30.length > 0 ? gmv30 / orders30.length : 0;

  // Orders per day, last 14 days (oldest → newest)
  const days = Array.from({ length: 14 }, (_, i) => {
    const date = new Date(now - (13 - i) * 24 * 3600 * 1000);
    const key = date.toISOString().slice(0, 10);
    return {
      key,
      label: date.toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit" }),
      count: 0,
    };
  });
  const dayMap = new Map(days.map((d) => [d.key, d]));
  for (const o of shopOrders) {
    const key = o.createdAt.toISOString().slice(0, 10);
    const day = dayMap.get(key);
    if (day) day.count += 1;
  }
  const maxDay = Math.max(1, ...days.map((d) => d.count));

  // Top products by quantity, from order item snapshots
  const productAgg = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const o of shopOrders) {
    for (const item of (o.items as OrderItem[]) ?? []) {
      const existing = productAgg.get(item.productId) ?? { name: item.name, qty: 0, revenue: 0 };
      existing.qty += item.qty;
      existing.revenue += parseFloat(item.price) * item.qty;
      productAgg.set(item.productId, existing);
    }
  }
  const topProducts = [...productAgg.values()].sort((a, b) => b.qty - a.qty).slice(0, 5);

  const tiles = [
    { label: "Zamówienia (30 dni)", value: String(orders30.length), hint: `${shopOrders.length} w 90 dni` },
    { label: "Sprzedaż (30 dni)", value: pln(gmv30), hint: `${pln(gmv90)} w 90 dni` },
    { label: "Średnie zamówienie", value: orders30.length ? pln(aov) : "—", hint: "z ostatnich 30 dni" },
    {
      label: "Nieopłacone",
      value: String(shopOrders.filter((o) => o.paymentStatus === "unpaid" && o.status !== "cancelled").length),
      hint: "czekają na przelew/pobranie",
    },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1
          className="text-xl font-bold"
          style={{ fontFamily: "var(--font-display)", color: "oklch(11% 0.10 275)" }}
        >
          Statystyki
        </h1>
        <p className="text-xs mt-0.5" style={{ color: "oklch(50% 0 0)" }}>
          Sprzedaż Twojego sklepu (bez zamówień anulowanych)
        </p>
      </div>

      {/* Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {tiles.map((t) => (
          <div
            key={t.label}
            className="rounded-2xl p-4"
            style={{ background: "#fff", border: "1px solid oklch(90% 0 0)" }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] mb-2" style={{ color: "oklch(50% 0 0)" }}>
              {t.label}
            </p>
            <p
              className="text-xl font-bold tabular-nums"
              style={{ fontFamily: "var(--font-display)", color: "oklch(11% 0.10 275)" }}
            >
              {t.value}
            </p>
            <p className="text-[11px] mt-1" style={{ color: "oklch(55% 0 0)" }}>{t.hint}</p>
          </div>
        ))}
      </div>

      {/* Daily orders bar chart */}
      <div
        className="rounded-2xl p-5 mb-6"
        style={{ background: "#fff", border: "1px solid oklch(90% 0 0)" }}
      >
        <h2
          className="text-sm font-semibold mb-4"
          style={{ fontFamily: "var(--font-display)", color: "oklch(11% 0.10 275)" }}
        >
          Zamówienia — ostatnie 14 dni
        </h2>
        {shopOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <BarChart2 className="w-8 h-8" style={{ color: "oklch(80% 0 0)" }} strokeWidth={1} />
            <p className="text-sm" style={{ color: "oklch(55% 0 0)" }}>
              Statystyki pojawią się po pierwszych zamówieniach
            </p>
          </div>
        ) : (
          <div className="flex items-end gap-1.5 h-32">
            {days.map((d) => (
              <div key={d.key} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
                <span className="text-[10px] tabular-nums" style={{ color: d.count > 0 ? "oklch(30% 0 0)" : "oklch(75% 0 0)" }}>
                  {d.count > 0 ? d.count : ""}
                </span>
                <div
                  className="w-full rounded-t-md transition-all"
                  style={{
                    height: `${Math.max(4, (d.count / maxDay) * 88)}px`,
                    background: d.count > 0 ? "oklch(56% 0.30 335)" : "oklch(94% 0 0)",
                  }}
                />
                <span className="text-[9px] truncate w-full text-center" style={{ color: "oklch(60% 0 0)" }}>
                  {d.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        {/* Top products */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "#fff", border: "1px solid oklch(90% 0 0)" }}
        >
          <h2
            className="text-sm font-semibold px-5 py-4"
            style={{ fontFamily: "var(--font-display)", color: "oklch(11% 0.10 275)", borderBottom: "1px solid oklch(92% 0 0)" }}
          >
            Najlepiej sprzedające się produkty
          </h2>
          {topProducts.length === 0 ? (
            <p className="px-5 py-8 text-sm text-center" style={{ color: "oklch(55% 0 0)" }}>
              Brak danych — pojawią się po pierwszej sprzedaży
            </p>
          ) : (
            topProducts.map((p, i) => (
              <div
                key={p.name + i}
                className="flex items-center justify-between gap-3 px-5 py-3"
                style={{ borderTop: i > 0 ? "1px solid oklch(94% 0 0)" : "none" }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-[11px] w-4 shrink-0" style={{ color: "oklch(55% 0 0)" }}>{i + 1}.</span>
                  <span className="text-xs font-medium truncate" style={{ color: "oklch(15% 0 0)" }}>{p.name}</span>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-semibold tabular-nums" style={{ color: "oklch(11% 0.10 275)" }}>
                    {p.qty} szt.
                  </p>
                  <p className="text-[11px] tabular-nums" style={{ color: "oklch(55% 0 0)" }}>{pln(p.revenue)}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Top customers */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "#fff", border: "1px solid oklch(90% 0 0)" }}
        >
          <h2
            className="text-sm font-semibold px-5 py-4"
            style={{ fontFamily: "var(--font-display)", color: "oklch(11% 0.10 275)", borderBottom: "1px solid oklch(92% 0 0)" }}
          >
            Najlepsi klienci
          </h2>
          {topCustomers.length === 0 ? (
            <p className="px-5 py-8 text-sm text-center" style={{ color: "oklch(55% 0 0)" }}>
              Brak danych — pojawią się po pierwszym zamówieniu
            </p>
          ) : (
            topCustomers.map((c, i) => (
              <div
                key={c.id}
                className="flex items-center justify-between gap-3 px-5 py-3"
                style={{ borderTop: i > 0 ? "1px solid oklch(94% 0 0)" : "none" }}
              >
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate" style={{ color: "oklch(15% 0 0)" }}>
                    {c.name ?? c.email}
                  </p>
                  <p className="text-[11px]" style={{ color: "oklch(55% 0 0)" }}>
                    {c.totalOrders} {c.totalOrders === 1 ? "zamówienie" : "zamówienia(ń)"}
                  </p>
                </div>
                <span className="text-xs font-semibold tabular-nums shrink-0" style={{ color: "oklch(11% 0.10 275)" }}>
                  {pln(parseFloat(c.totalSpent ?? "0"))}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
