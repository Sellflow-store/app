import "server-only";
import { sql } from "drizzle-orm";
import { db } from "./db";

/**
 * Kolejka „Wymaga uwagi" w /ops: sytuacje, w których ktoś z zespołu powinien
 * zareagować, zanim zauważy je klient. Każda reguła to jedno zapytanie po
 * wszystkich żywych sklepach (bez usuniętych i zawieszonych); pusta kolejka
 * znaczy „wszystko gra".
 *
 * Progi są celowo zachowawcze: lepiej przegapić graniczny przypadek, niż
 * nauczyć zespół ignorować listę, bo zawsze coś na niej wisi.
 */

export type AttentionSeverity = "high" | "medium" | "low";

export interface AttentionItem {
  kind: string;
  severity: AttentionSeverity;
  shopSlug: string;
  shopName: string;
  title: string;
  detail: string;
}

/** Opłacone, a niewysłane dłużej niż tyle dni. */
export const PAID_NOT_SHIPPED_DAYS = 3;
/** Sklep „utknął w konfiguracji": starszy niż MIN, młodszy niż MAX dni. */
export const STUCK_SETUP_MIN_DAYS = 7;
export const STUCK_SETUP_MAX_DAYS = 60;
/** Tyle wejść na zamówienie w 7 dni bez żadnego zamówienia to sygnał awarii. */
export const CHECKOUT_VIEWS_NO_ORDERS = 10;
/** Tyle automatycznie anulowanych nieopłaconych zamówień w 7 dni. */
export const EXPIRED_UNPAID_THRESHOLD = 3;

const SEVERITY_ORDER: Record<AttentionSeverity, number> = { high: 0, medium: 1, low: 2 };

type Row = Record<string, unknown>;

async function rows<T extends Row>(query: ReturnType<typeof sql>): Promise<T[]> {
  const res = await db.execute(query);
  return (res as unknown as { rows: T[] }).rows;
}

const LIVE = sql`s.deleted_at IS NULL AND s.suspended = false`;

function plural(n: number, one: string, few: string, many: string): string {
  if (n === 1) return one;
  const d = n % 10;
  const t = n % 100;
  return d >= 2 && d <= 4 && (t < 12 || t > 14) ? few : many;
}

export async function loadAttentionItems(): Promise<AttentionItem[]> {
  const [domains, unshipped, stuck, checkoutDead, expired] = await Promise.all([
    // 1. Domena podpięta, ale niezweryfikowana: sklep nie działa pod nią.
    rows<{ slug: string; name: string; domain: string }>(sql`
      SELECT s.slug, s.name, s.custom_domain AS domain
      FROM shops s
      WHERE ${LIVE} AND s.custom_domain IS NOT NULL AND s.custom_domain_verified = false
    `),

    // 2. Opłacone zamówienia czekające na wysyłkę.
    rows<{ slug: string; name: string; n: number; days: number }>(sql`
      SELECT s.slug, s.name, COUNT(*)::int AS n,
        EXTRACT(DAY FROM now() - MIN(o.created_at))::int AS days
      FROM orders o JOIN shops s ON s.id = o.shop_id
      WHERE ${LIVE}
        AND o.payment_status = 'paid'
        AND o.status IN ('pending', 'processing')
        AND o.created_at < now() - make_interval(days => ${PAID_NOT_SHIPPED_DAYS}::int)
      GROUP BY s.slug, s.name
    `),

    // 3. Sklep utknął w konfiguracji: brak produktów albo brak płatności.
    //    Płatność = Tpay włączony z kluczami, przelew z numerem konta, albo pobranie.
    rows<{ slug: string; name: string; products: number; payments: boolean; days: number }>(sql`
      SELECT s.slug, s.name,
        (SELECT COUNT(*)::int FROM products p WHERE p.shop_id = s.id) AS products,
        (
          EXISTS (
            SELECT 1 FROM shop_integrations i
            WHERE i.shop_id = s.id AND i.provider = 'tpay' AND i.enabled
              AND coalesce(i.settings->>'clientId', '') <> ''
              AND coalesce(i.settings->>'secretEnc', '') <> ''
          )
          OR EXISTS (
            SELECT 1 FROM shop_config c
            WHERE c.shop_id = s.id AND c.key = 'checkout'
              AND (
                (c.value->>'transferEnabled' = 'true' AND coalesce(c.value->>'bankAccount', '') <> '')
                OR c.value->>'codEnabled' = 'true'
              )
          )
        ) AS payments,
        EXTRACT(DAY FROM now() - s.created_at)::int AS days
      FROM shops s
      WHERE ${LIVE} AND s.active
        AND s.created_at < now() - make_interval(days => ${STUCK_SETUP_MIN_DAYS}::int)
        AND s.created_at > now() - make_interval(days => ${STUCK_SETUP_MAX_DAYS}::int)
    `),

    // 4. Klienci wchodzą na zamówienie, ale nikt go nie składa: zwykle zepsuta
    //    płatność albo dostawa.
    rows<{ slug: string; name: string; views: number }>(sql`
      SELECT s.slug, s.name, COUNT(*)::int AS views
      FROM checkout_events e JOIN shops s ON s.id = e.shop_id
      WHERE ${LIVE}
        AND e.event = 'checkout_view'
        AND e.created_at > now() - interval '7 days'
        AND NOT EXISTS (
          SELECT 1 FROM orders o
          WHERE o.shop_id = s.id AND o.created_at > now() - interval '7 days'
        )
      GROUP BY s.slug, s.name
      HAVING COUNT(*) >= ${CHECKOUT_VIEWS_NO_ORDERS}
    `),

    // 5. Dużo zamówień anulowanych przez automat po 48 h bez wpłaty.
    rows<{ slug: string; name: string; n: number }>(sql`
      SELECT s.slug, s.name, COUNT(*)::int AS n
      FROM orders o JOIN shops s ON s.id = o.shop_id
      WHERE ${LIVE}
        AND o.payment_method = 'online'
        AND o.payment_status = 'unpaid'
        AND o.status = 'cancelled'
        AND o.updated_at > now() - interval '7 days'
      GROUP BY s.slug, s.name
      HAVING COUNT(*) >= ${EXPIRED_UNPAID_THRESHOLD}
    `),
  ]);

  const items: AttentionItem[] = [];

  for (const r of domains) {
    items.push({
      kind: "domain_unverified",
      severity: "high",
      shopSlug: r.slug,
      shopName: r.name,
      title: "Domena niezweryfikowana",
      detail: `${r.domain} nie jest zweryfikowana, więc sklep nie działa pod tym adresem. Sprawdź DNS albo zweryfikuj domenę ręcznie.`,
    });
  }

  for (const r of unshipped) {
    const days = r.days;
    items.push({
      kind: "paid_not_shipped",
      severity: "high",
      shopSlug: r.slug,
      shopName: r.name,
      title: `${r.n} ${plural(r.n, "opłacone zamówienie czeka", "opłacone zamówienia czekają", "opłaconych zamówień czeka")} na wysyłkę`,
      detail: `Najstarsze od ${days} ${plural(days, "dnia", "dni", "dni")}. Ryzyko reklamacji u klienta sklepu.`,
    });
  }

  for (const r of checkoutDead) {
    items.push({
      kind: "checkout_no_orders",
      severity: "high",
      shopSlug: r.slug,
      shopName: r.name,
      title: "Wejścia na zamówienie bez zamówień",
      detail: `${r.views} wejść na formularz zamówienia w 7 dni i ani jednego zamówienia. Sprawdź płatności i dostawę.`,
    });
  }

  for (const r of expired) {
    items.push({
      kind: "unpaid_expired",
      severity: "medium",
      shopSlug: r.slug,
      shopName: r.name,
      title: `${r.n} ${plural(r.n, "zamówienie anulowane", "zamówienia anulowane", "zamówień anulowanych")} bez wpłaty`,
      detail: "Automat anulował je po 48 h. Klienci mogą nie móc zapłacić przez Tpay.",
    });
  }

  for (const r of stuck) {
    const missing = [r.products === 0 && "produktów", !r.payments && "płatności"].filter(Boolean);
    if (missing.length === 0) continue;
    items.push({
      kind: "stuck_setup",
      severity: "low",
      shopSlug: r.slug,
      shopName: r.name,
      title: "Sklep utknął w konfiguracji",
      detail: `Założony ${r.days} dni temu i nadal bez ${missing.join(" i ")}. Kandydat do kontaktu.`,
    });
  }

  return items.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}
