import "server-only";
import { clerkClient } from "@clerk/nextjs/server";
import { sql } from "drizzle-orm";
import { db } from "./db";

/**
 * Lista sklepów dla /ops/shops i jej eksportu CSV. Jedno zapytanie z
 * agregatami (produkty, GMV 30 dni, ostatnie zamówienie) plus jedno zapytanie
 * do Clerka o ostatnią aktywność właścicieli. Sortowanie w pamięci: sklepów
 * są setki, nie miliony, a aktywność z Clerka i tak nie siedzi w bazie.
 */

export type OpsShopSort = "created" | "gmv" | "last_order" | "products" | "active";
export const OPS_SHOP_SORTS: OpsShopSort[] = ["created", "gmv", "last_order", "products", "active"];
export const OPS_PLANS = ["free", "starter", "pro"] as const;

export interface OpsShopFilter {
  deleted: boolean;
  term: string;
  plan: string | null;
  sort: OpsShopSort;
}

export interface OpsShopRow {
  id: string;
  slug: string;
  name: string;
  active: boolean;
  suspended: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  ownerEmail: string;
  ownerPlan: string;
  productCount: number;
  gmv30: number;
  orders30: number;
  lastOrderAt: Date | null;
  /** Ostatnia aktywność właściciela w Clerku; null gdy brak danych. */
  ownerActiveAt: Date | null;
}

export function parseOpsShopFilter(p: {
  widok?: string;
  q?: string;
  plan?: string;
  sort?: string;
}): OpsShopFilter {
  return {
    deleted: p.widok === "usuniete",
    term: (p.q ?? "").trim(),
    plan: OPS_PLANS.includes(p.plan as (typeof OPS_PLANS)[number]) ? p.plan! : null,
    sort: OPS_SHOP_SORTS.includes(p.sort as OpsShopSort) ? (p.sort as OpsShopSort) : "created",
  };
}

interface RawRow {
  id: string;
  slug: string;
  name: string;
  active: boolean;
  suspended: boolean;
  deleted_at: string | null;
  created_at: string;
  owner_email: string;
  owner_plan: string;
  owner_clerk_id: string;
  product_count: number;
  gmv30: string | null;
  orders30: number;
  last_order_at: string | null;
}

async function ownerActivity(clerkIds: string[]): Promise<Map<string, Date>> {
  const out = new Map<string, Date>();
  if (clerkIds.length === 0) return out;
  try {
    const client = await clerkClient();
    for (let i = 0; i < clerkIds.length; i += 100) {
      const { data } = await client.users.getUserList({ userId: clerkIds.slice(i, i + 100), limit: 100 });
      for (const u of data) {
        const ts = u.lastActiveAt ?? u.lastSignInAt;
        if (ts) out.set(u.id, new Date(ts));
      }
    }
  } catch {
    // Clerk niedostępny: lista działa dalej, kolumna aktywności jest pusta.
  }
  return out;
}

export async function loadOpsShops(f: OpsShopFilter): Promise<OpsShopRow[]> {
  const like = `%${f.term}%`;
  const res = await db.execute(sql`
    SELECT s.id, s.slug, s.name, s.active, s.suspended, s.deleted_at, s.created_at,
      u.email AS owner_email, u.plan AS owner_plan, u.clerk_id AS owner_clerk_id,
      (SELECT COUNT(*)::int FROM products p WHERE p.shop_id = s.id) AS product_count,
      (SELECT SUM(o.total) FROM orders o
        WHERE o.shop_id = s.id AND o.status <> 'cancelled'
          AND o.created_at > now() - interval '30 days') AS gmv30,
      (SELECT COUNT(*)::int FROM orders o
        WHERE o.shop_id = s.id AND o.status <> 'cancelled'
          AND o.created_at > now() - interval '30 days') AS orders30,
      (SELECT MAX(o.created_at) FROM orders o WHERE o.shop_id = s.id) AS last_order_at
    FROM shops s JOIN users u ON u.id = s.owner_id
    WHERE ${f.deleted ? sql`s.deleted_at IS NOT NULL` : sql`s.deleted_at IS NULL`}
      ${f.term ? sql`AND (s.slug ILIKE ${like} OR s.name ILIKE ${like} OR u.email ILIKE ${like})` : sql``}
      ${f.plan ? sql`AND u.plan = ${f.plan}` : sql``}
  `);
  const raw = (res as unknown as { rows: RawRow[] }).rows;
  const activity = await ownerActivity(raw.map((r) => r.owner_clerk_id));

  const rows: OpsShopRow[] = raw.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    active: r.active,
    suspended: r.suspended,
    deletedAt: r.deleted_at ? new Date(r.deleted_at) : null,
    createdAt: new Date(r.created_at),
    ownerEmail: r.owner_email,
    ownerPlan: r.owner_plan,
    productCount: r.product_count,
    gmv30: r.gmv30 ? parseFloat(r.gmv30) : 0,
    orders30: r.orders30,
    lastOrderAt: r.last_order_at ? new Date(r.last_order_at) : null,
    ownerActiveAt: activity.get(r.owner_clerk_id) ?? null,
  }));

  const time = (d: Date | null) => d?.getTime() ?? 0;
  const key: Record<OpsShopSort, (r: OpsShopRow) => number> = {
    created: (r) => time(r.createdAt),
    gmv: (r) => r.gmv30,
    last_order: (r) => time(r.lastOrderAt),
    products: (r) => r.productCount,
    active: (r) => time(r.ownerActiveAt),
  };
  const k = key[f.sort];
  return rows.sort((a, b) => k(b) - k(a) || time(b.createdAt) - time(a.createdAt));
}

/** Status sklepu słownie, wspólny dla tabeli i CSV. */
export function opsShopStatus(r: Pick<OpsShopRow, "deletedAt" | "suspended" | "active">): string {
  if (r.deletedAt) return "Usunięty";
  if (r.suspended) return "Zawieszony";
  return r.active ? "Aktywny" : "Wyłączony";
}

/** Liczniki zakładek Aktywne / Usunięte przy tych samych filtrach. */
export async function countOpsShops(f: OpsShopFilter): Promise<{ live: number; deleted: number }> {
  const like = `%${f.term}%`;
  const res = await db.execute(sql`
    SELECT
      COUNT(*) FILTER (WHERE s.deleted_at IS NULL)::int AS live,
      COUNT(*) FILTER (WHERE s.deleted_at IS NOT NULL)::int AS deleted
    FROM shops s JOIN users u ON u.id = s.owner_id
    WHERE true
      ${f.term ? sql`AND (s.slug ILIKE ${like} OR s.name ILIKE ${like} OR u.email ILIKE ${like})` : sql``}
      ${f.plan ? sql`AND u.plan = ${f.plan}` : sql``}
  `);
  const row = (res as unknown as { rows: { live: number; deleted: number }[] }).rows[0];
  return { live: row?.live ?? 0, deleted: row?.deleted ?? 0 };
}
