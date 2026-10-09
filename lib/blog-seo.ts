import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { shopConfig } from "@/lib/db/schema";
import { cleanAlt, normalizeSeo, type PageSeo } from "@/lib/product-seo";

/**
 * SEO wpisu na blogu: tytuł i opis w Google, frazy i opis zdjęcia głównego.
 * Tabela `blog_posts` nie ma na to kolumny, a nie chcemy migracji, więc dane
 * leżą w `shop_config` pod kluczem `blogSeo`, jako mapa: id wpisu → SEO.
 * Serwer-only (dotyka bazy); typy i walidacja są w product-seo.
 */
export interface BlogSeo extends PageSeo {
  /** Opis alternatywny zdjęcia głównego. */
  coverAlt?: string;
}

const KEY = "blogSeo";

export function normalizeBlogSeo(raw: unknown): BlogSeo | undefined {
  const base = normalizeSeo(raw);
  const coverAlt = cleanAlt((raw as { coverAlt?: unknown } | null | undefined)?.coverAlt);
  if (!base && !coverAlt) return undefined;
  return { ...(base ?? {}), ...(coverAlt ? { coverAlt } : {}) };
}

export async function readBlogSeo(shopId: string, postId: string): Promise<BlogSeo | undefined> {
  const row = await db.query.shopConfig.findFirst({
    where: and(eq(shopConfig.shopId, shopId), eq(shopConfig.key, KEY)),
  });
  return normalizeBlogSeo((row?.value as Record<string, unknown> | undefined)?.[postId]);
}

/** Zapisuje SEO jednego wpisu bez ruszania pozostałych (merge po stronie bazy). Puste = usuń. */
export async function writeBlogSeo(shopId: string, postId: string, raw: unknown): Promise<void> {
  const seo = normalizeBlogSeo(raw);
  if (!seo) return deleteBlogSeo(shopId, postId);
  const patch = JSON.stringify({ [postId]: seo });
  await db
    .insert(shopConfig)
    .values({ shopId, key: KEY, value: { [postId]: seo }, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: [shopConfig.shopId, shopConfig.key],
      set: { value: sql`${shopConfig.value} || ${patch}::jsonb`, updatedAt: new Date() },
    });
}

export async function deleteBlogSeo(shopId: string, postId: string): Promise<void> {
  await db
    .update(shopConfig)
    .set({ value: sql`${shopConfig.value} - ${postId}::text`, updatedAt: new Date() })
    .where(and(eq(shopConfig.shopId, shopId), eq(shopConfig.key, KEY)));
}
