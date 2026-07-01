import { db } from "./db";
import { priceHistory } from "./db/schema";
import { and, gte, inArray, min } from "drizzle-orm";

const WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

/** Append a price point for a product. Call whenever the selling price changes. */
export async function recordPrice(shopId: string, productId: string, price: string): Promise<void> {
  try {
    await db.insert(priceHistory).values({ shopId, productId, price });
  } catch {
    // Never block a product save on price-history bookkeeping.
  }
}

/**
 * Najniższa cena z 30 dni per produkt (Omnibus). Returns a Map of
 * productId → lowest price string, only for products that have any history
 * in the window.
 */
export async function getLowestPrices30(productIds: string[]): Promise<Map<string, string>> {
  if (productIds.length === 0) return new Map();
  try {
    const since = new Date(Date.now() - WINDOW_MS);
    const rows = await db
      .select({ productId: priceHistory.productId, low: min(priceHistory.price) })
      .from(priceHistory)
      .where(and(inArray(priceHistory.productId, productIds), gte(priceHistory.recordedAt, since)))
      .groupBy(priceHistory.productId);
    return new Map(rows.filter((r) => r.low != null).map((r) => [r.productId, r.low as string]));
  } catch {
    return new Map();
  }
}
