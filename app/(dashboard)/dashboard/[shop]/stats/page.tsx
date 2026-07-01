import { db } from "@/lib/db";
import { orders, customers, visits } from "@/lib/db/schema";
import { and, desc, eq, gte, lte, ne } from "drizzle-orm";
import { getShopAccess } from "@/lib/api";
import { TrendingUp, TrendingDown, ShoppingBag } from "lucide-react";
import RangePicker from "./RangePicker";
import {
  SOURCE_LABELS,
  AI_LABELS,
  type TrafficSource,
  type AiSource,
} from "@/lib/traffic";

const pln = (v: number) => `${v.toFixed(2).replace(".", ",")} zł`;
const INK = "oklch(11% 0.10 275)";
const MUTE = "oklch(50% 0 0)";
const RULE = "oklch(90% 0 0)";
const ACCENT = "#e8590c"; // analytics accent (orange, per design)
const UP = "oklch(58% 0.15 150)";
const DOWN = "oklch(58% 0.20 25)";
const DAY = 24 * 3600 * 1000;

interface OrderItem {
  productId: string;
  name: string;
  price: string;
  qty: number;
}

const AI_ORDER: AiSource[] = ["chatgpt", "claude", "perplexity", "gemini"];
const AI_DOTS: Record<AiSource, string> = {
  chatgpt: "#10a37f",
  claude: "#d97757",
  perplexity: "#20808d",
  gemini: "#4285f4",
  copilot: "#0a84ff",
  other: "#9ca3af",
};
const SOURCE_ORDER: TrafficSource[] = ["direct", "ai", "search", "social", "referral"];
const SOURCE_COLOR: Record<TrafficSource, string> = {
  direct: "oklch(60% 0 0)",
  ai: ACCENT,
  search: "#4285f4",
  social: "#c13584",
  referral: "oklch(45% 0.10 275)",
};

function pctDelta(cur: number, prev: number): number | null {
  if (prev === 0) return null;
  return ((cur - prev) / prev) * 100;
}

function DeltaBadge({ delta, unit = "%" }: { delta: number | null; unit?: string }) {
  if (delta === null || !isFinite(delta)) {
    return <span className="text-[13px]" style={{ color: "oklch(70% 0 0)" }}>—</span>;
  }
  const up = delta >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span className="inline-flex items-center gap-1 text-[13px] font-medium" style={{ color: up ? UP : DOWN }}>
      <Icon className="w-3.5 h-3.5" strokeWidth={2} />
      {up ? "+" : ""}
      {delta.toFixed(0)}
      {unit}
    </span>
  );
}

export default async function AnalyticsPage({
  params,
  searchParams,
}: {
  params: Promise<{ shop: string }>;
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}) {
  const { shop: shopSlug } = await params;
  const sp = await searchParams;

  const isoOk = (s?: string) => (/^\d{4}-\d{2}-\d{2}$/.test(s ?? "") ? (s as string) : null);
  let fromISO = isoOk(sp?.from);
  let toISO = isoOk(sp?.to);
  if (fromISO && toISO && fromISO > toISO) [fromISO, toISO] = [toISO, fromISO];
  const isCustom = !!(fromISO && toISO);

  const now = Date.now();
  const presetRange = ["7", "30", "90"].includes(sp?.range ?? "") ? (sp!.range as string) : "30";

  let curStart: number;
  let curEnd: number;
  if (isCustom) {
    curStart = new Date(`${fromISO}T00:00:00`).getTime();
    curEnd = Math.min(now, new Date(`${toISO}T23:59:59.999`).getTime());
  } else {
    curEnd = now;
    curStart = now - parseInt(presetRange, 10) * DAY;
  }
  const windowMs = Math.max(DAY, curEnd - curStart);
  const rangeDays = Math.min(370, Math.max(1, Math.round(windowMs / DAY)));
  const prevStart = curStart - windowMs;

  const fmtShort = (ms: number) =>
    new Date(ms).toLocaleDateString("pl-PL", { day: "numeric", month: "short" });
  const rangeLabel = isCustom
    ? `${fmtShort(curStart)} – ${fmtShort(curEnd)}`
    : ({ "7": "Ostatnie 7 dni", "30": "Ostatnie 30 dni", "90": "Ostatnie 90 dni" }[presetRange] as string);

  let periodOrders: (typeof orders.$inferSelect)[] = [];
  let periodVisits: (typeof visits.$inferSelect)[] = [];
  let customerList: { email: string; totalOrders: number }[] = [];

  try {
    const access = await getShopAccess(shopSlug);
    if (access) {
      const since = new Date(prevStart);
      const until = new Date(curEnd);
      [periodOrders, periodVisits, customerList] = await Promise.all([
        db
          .select()
          .from(orders)
          .where(
            and(
              eq(orders.shopId, access.shopId),
              ne(orders.status, "cancelled"),
              gte(orders.createdAt, since),
              lte(orders.createdAt, until)
            )
          )
          .orderBy(desc(orders.createdAt)),
        db
          .select()
          .from(visits)
          .where(
            and(
              eq(visits.shopId, access.shopId),
              gte(visits.createdAt, since),
              lte(visits.createdAt, until)
            )
          ),
        db
          .select({ email: customers.email, totalOrders: customers.totalOrders })
          .from(customers)
          .where(eq(customers.shopId, access.shopId)),
      ]);
    }
  } catch {
    // DB not configured — render empty state
  }

  // ── Split into current vs previous window ──────────────────────────────────
  const curOrders = periodOrders.filter((o) => o.createdAt.getTime() >= curStart);
  const prevOrders = periodOrders.filter((o) => o.createdAt.getTime() < curStart);
  const curVisits = periodVisits.filter((v) => v.createdAt.getTime() >= curStart);

  const gmv = (arr: typeof curOrders) => arr.reduce((s, o) => s + parseFloat(o.total), 0);
  const grossCur = gmv(curOrders);
  const grossPrev = gmv(prevOrders);
  const paidCur = curOrders.filter((o) => o.paymentStatus === "paid").length;
  const paidPrev = prevOrders.filter((o) => o.paymentStatus === "paid").length;

  const totalOrdersByEmail = new Map(customerList.map((c) => [c.email, c.totalOrders]));
  const returningPct = (arr: typeof curOrders) => {
    const buyers = new Set(arr.map((o) => o.customerEmail));
    if (buyers.size === 0) return 0;
    let ret = 0;
    buyers.forEach((e) => {
      if ((totalOrdersByEmail.get(e) ?? 1) > 1) ret++;
    });
    return (ret / buyers.size) * 100;
  };
  const retCur = returningPct(curOrders);
  const retPrev = returningPct(prevOrders);

  const tiles = [
    { label: "Sprzedaż brutto", value: pln(grossCur), delta: pctDelta(grossCur, grossPrev), unit: "%" },
    {
      label: "Powracający klienci",
      value: `${retCur.toFixed(0)}%`,
      delta: retPrev === 0 && retCur === 0 ? null : Math.round(retCur - retPrev),
      unit: "pp",
    },
    { label: "Opłacone zamówienia", value: String(paidCur), delta: pctDelta(paidCur, paidPrev), unit: "%" },
    { label: "Zamówienia", value: String(curOrders.length), delta: pctDelta(curOrders.length, prevOrders.length), unit: "%" },
  ];

  // ── Sales over time: daily buckets, current + previous window ───────────────
  const buckets = Array.from({ length: rangeDays }, (_, i) => ({
    date: new Date(curStart + i * DAY),
    cur: 0,
    prev: 0,
  }));
  for (const o of curOrders) {
    const i = Math.min(rangeDays - 1, Math.max(0, Math.floor((o.createdAt.getTime() - curStart) / DAY)));
    buckets[i].cur += parseFloat(o.total);
  }
  for (const o of prevOrders) {
    const i = Math.min(rangeDays - 1, Math.max(0, Math.floor((o.createdAt.getTime() - prevStart) / DAY)));
    buckets[i].prev += parseFloat(o.total);
  }
  const chartMax = Math.max(1, ...buckets.map((b) => Math.max(b.cur, b.prev)));

  const W = 720;
  const H = 180;
  const n = buckets.length;
  const xAt = (i: number) => (n <= 1 ? 0 : (i / (n - 1)) * W);
  const yAt = (v: number) => H - (v / chartMax) * (H - 8) - 4;
  const curLine = buckets.map((b, i) => `${xAt(i).toFixed(1)},${yAt(b.cur).toFixed(1)}`);
  const prevLine = buckets.map((b, i) => `${xAt(i).toFixed(1)},${yAt(b.prev).toFixed(1)}`);
  const areaPath = `M ${curLine.join(" L ")} L ${W},${H} L 0,${H} Z`;
  const fmtDay = (d: Date) => d.toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit" });
  const axisLabels = [buckets[0]?.date, buckets[Math.floor(n / 2)]?.date, buckets[n - 1]?.date];

  // ── AI visibility ──────────────────────────────────────────────────────────
  const aiVisits = curVisits.filter((v) => v.source === "ai");
  const aiByAssistant = new Map<AiSource, number>();
  for (const v of aiVisits) {
    const key = (v.aiSource ?? "other") as AiSource;
    aiByAssistant.set(key, (aiByAssistant.get(key) ?? 0) + 1);
  }

  // ── Traffic sources ────────────────────────────────────────────────────────
  const sourceCounts = new Map<TrafficSource, number>();
  for (const v of curVisits) {
    const key = (v.source ?? "direct") as TrafficSource;
    sourceCounts.set(key, (sourceCounts.get(key) ?? 0) + 1);
  }
  const totalVisits = curVisits.length;
  const sourceRows = SOURCE_ORDER.map((s) => ({ source: s, count: sourceCounts.get(s) ?? 0 }))
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count);

  // ── Top products (current window) ──────────────────────────────────────────
  const productAgg = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const o of curOrders) {
    for (const item of (o.items as OrderItem[]) ?? []) {
      const e = productAgg.get(item.productId) ?? { name: item.name, qty: 0, revenue: 0 };
      e.qty += item.qty;
      e.revenue += parseFloat(item.price) * item.qty;
      productAgg.set(item.productId, e);
    }
  }
  const topProducts = [...productAgg.values()].sort((a, b) => b.qty - a.qty).slice(0, 5);

  const card = { background: "#fff", border: `1px solid ${RULE}` };

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-3" style={{ fontFamily: "var(--font-display)", color: INK }}>
          Analityka
        </h1>
        <RangePicker
          value={isCustom ? "" : presetRange}
          from={fromISO ?? undefined}
          to={toISO ?? undefined}
          label={rangeLabel}
        />
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-2xl p-4" style={card}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] mb-2" style={{ color: MUTE }}>
              {t.label}
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold tabular-nums" style={{ fontFamily: "var(--font-display)", color: INK }}>
                {t.value}
              </p>
              <DeltaBadge delta={t.delta} unit={t.unit} />
            </div>
          </div>
        ))}
      </div>

      {/* Sales chart + AI visibility */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6 items-stretch">
        {/* Sales over time */}
        <div className="lg:col-span-2 rounded-2xl p-5" style={card}>
          <p className="text-sm font-semibold mb-1" style={{ fontFamily: "var(--font-display)", color: INK }}>
            Łączna sprzedaż w czasie
          </p>
          <p className="text-2xl font-bold tabular-nums mb-4" style={{ fontFamily: "var(--font-display)", color: INK }}>
            {pln(grossCur)}
          </p>

          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full" style={{ height: 200 }}>
            <defs>
              <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={ACCENT} stopOpacity="0.18" />
                <stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* baselines */}
            {[0.25, 0.5, 0.75].map((f) => (
              <line key={f} x1="0" y1={H * f} x2={W} y2={H * f} stroke={RULE} strokeWidth="1" strokeDasharray="4 5" vectorEffect="non-scaling-stroke" />
            ))}
            <path d={areaPath} fill="url(#salesFill)" />
            {/* previous period (dashed) */}
            <polyline
              points={prevLine.join(" ")}
              fill="none"
              stroke="oklch(72% 0 0)"
              strokeWidth="1.5"
              strokeDasharray="5 4"
              vectorEffect="non-scaling-stroke"
            />
            {/* current period */}
            <polyline
              points={curLine.join(" ")}
              fill="none"
              stroke={ACCENT}
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          <div className="flex items-center justify-between mt-2">
            {axisLabels.map((d, i) => (
              <span key={i} className="text-[10px] tabular-nums" style={{ color: "oklch(60% 0 0)" }}>
                {d ? fmtDay(d) : ""}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-5 mt-3 pt-3" style={{ borderTop: `1px solid ${RULE}` }}>
            <span className="inline-flex items-center gap-1.5 text-[11px]" style={{ color: MUTE }}>
              <span className="w-4 h-[2px] rounded" style={{ background: ACCENT }} />
              Wybrany okres
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px]" style={{ color: MUTE }}>
              <span className="w-4 h-0 border-t-[1.5px] border-dashed" style={{ borderColor: "oklch(72% 0 0)" }} />
              Poprzedni okres
            </span>
          </div>
        </div>

        {/* AI visibility */}
        <div className="rounded-2xl p-5 relative overflow-hidden flex flex-col" style={{ background: "#111014", border: "1px solid #26242c" }}>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: `radial-gradient(120% 80% at 50% 30%, ${ACCENT}22 0%, transparent 60%)` }}
          />
          <div className="relative flex-1 flex flex-col">
            <span
              className="self-center inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium mb-4"
              style={{ background: "#ffffff10", color: "#f5f5f7", border: "1px solid #ffffff1a" }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: ACCENT }} />
              Widoczność w AI
            </span>

            {/* decorative orbit */}
            <div className="flex items-center justify-center py-2">
              <svg viewBox="0 0 120 120" className="w-28 h-28">
                <circle cx="60" cy="60" r="46" fill="none" stroke="#ffffff14" strokeWidth="1" />
                <ellipse cx="60" cy="60" rx="46" ry="18" fill="none" stroke="#ffffff14" strokeWidth="1" />
                <ellipse cx="60" cy="60" rx="18" ry="46" fill="none" stroke="#ffffff14" strokeWidth="1" />
                <ellipse cx="60" cy="60" rx="38" ry="46" fill="none" stroke="#ffffff0d" strokeWidth="1" />
                <circle cx="60" cy="60" r="5" fill={ACCENT} />
                <circle cx="60" cy="14" r="2.5" fill="#ffffff66" />
                <circle cx="106" cy="60" r="2.5" fill="#ffffff66" />
                <circle cx="78" cy="98" r="2.5" fill="#ffffff66" />
              </svg>
            </div>

            <div className="text-center mt-1">
              <p className="text-4xl font-bold tabular-nums" style={{ color: "#fff", fontFamily: "var(--font-display)" }}>
                {aiVisits.length}
                <span className="text-sm font-normal ml-1.5" style={{ color: "#a1a1aa" }}>
                  wizyt AI
                </span>
              </p>
              <p className="text-[12px] mt-2 leading-snug" style={{ color: "#a1a1aa" }}>
                {aiVisits.length > 0
                  ? "Klienci trafiają do Ciebie z asystentów AI"
                  : "Gotowy na erę AI — widoczny dla ChatGPT, Claude i Perplexity"}
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-1.5 mt-4">
              {AI_ORDER.map((ai) => {
                const c = aiByAssistant.get(ai) ?? 0;
                return (
                  <span
                    key={ai}
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px]"
                    style={{ background: "#ffffff0d", color: c > 0 ? "#f5f5f7" : "#8b8b93", border: "1px solid #ffffff14" }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: AI_DOTS[ai] }} />
                    {AI_LABELS[ai]}
                    {c > 0 && <span className="tabular-nums font-medium">{c}</span>}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Top products + traffic sources */}
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        {/* Top products */}
        <div className="rounded-2xl overflow-hidden" style={card}>
          <h2 className="text-sm font-semibold px-5 py-4" style={{ fontFamily: "var(--font-display)", color: INK, borderBottom: `1px solid ${RULE}` }}>
            Najlepsze produkty
          </h2>
          {topProducts.length === 0 ? (
            <p className="px-5 py-10 text-sm text-center" style={{ color: MUTE }}>
              Brak sprzedaży w wybranym okresie.
            </p>
          ) : (
            topProducts.map((p, i) => (
              <div key={p.name + i} className="flex items-center justify-between gap-3 px-5 py-3" style={{ borderTop: i > 0 ? `1px solid oklch(94% 0 0)` : "none" }}>
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-[11px] w-4 shrink-0" style={{ color: MUTE }}>{i + 1}.</span>
                  <span className="text-xs font-medium truncate" style={{ color: "oklch(15% 0 0)" }}>{p.name}</span>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-semibold tabular-nums" style={{ color: INK }}>{p.qty} szt.</p>
                  <p className="text-[11px] tabular-nums" style={{ color: MUTE }}>{pln(p.revenue)}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Traffic sources */}
        <div className="rounded-2xl overflow-hidden" style={card}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${RULE}` }}>
            <h2 className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)", color: INK }}>
              Źródła ruchu
            </h2>
            {totalVisits > 0 && (
              <span className="text-[11px] tabular-nums" style={{ color: MUTE }}>
                {totalVisits} {totalVisits === 1 ? "wizyta" : "wizyt"}
              </span>
            )}
          </div>
          {sourceRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-5 py-10 gap-2">
              <ShoppingBag className="w-7 h-7" style={{ color: "oklch(82% 0 0)" }} strokeWidth={1} />
              <p className="text-sm text-center" style={{ color: MUTE }}>Brak danych w wybranym okresie.</p>
            </div>
          ) : (
            <div className="px-5 py-4 space-y-3">
              {sourceRows.map((r) => {
                const pct = totalVisits > 0 ? (r.count / totalVisits) * 100 : 0;
                return (
                  <div key={r.source}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="inline-flex items-center gap-2 text-xs font-medium" style={{ color: "oklch(20% 0 0)" }}>
                        <span className="w-2 h-2 rounded-full" style={{ background: SOURCE_COLOR[r.source] }} />
                        {SOURCE_LABELS[r.source]}
                      </span>
                      <span className="text-[11px] tabular-nums" style={{ color: MUTE }}>
                        {r.count} · {pct.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "oklch(94% 0 0)" }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: SOURCE_COLOR[r.source] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
