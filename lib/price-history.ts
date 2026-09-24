import { db } from "./db";
import { priceHistory } from "./db/schema";
import { asc, inArray } from "drizzle-orm";

const WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

/** Append a price point for a product. Call whenever the selling price changes. */
export async function recordPrice(shopId: string, productId: string, price: string): Promise<void> {
  try {
    await db.insert(priceHistory).values({ shopId, productId, price });
  } catch {
    // Never block a product save on price-history bookkeeping.
  }
}

const toGrosze = (price: string) => Math.round(parseFloat(price) * 100);
const fromGrosze = (g: number) => (g / 100).toFixed(2);

/**
 * Omnibus (art. 6a dyrektywy 98/6/WE po zmianach 2019/2161): przy obniżce
 * pokazujemy najniższą cenę z 30 dni PRZED obniżką, nie z ostatnich 30 dni.
 *
 * Historia dostaje wiersz przy każdym zapisie produktu, także bez zmiany ceny,
 * więc obniżka zaczyna się od najstarszego wiersza w końcowej serii wierszy
 * z bieżącą ceną. Kandydaci to ceny zapisane w 30 dniach przed tym momentem
 * oraz cena, która obowiązywała na początku tego okna (ostatni wiersz sprzed
 * okna). Bez wcześniejszej historii (produkt od startu w tej cenie) najniższą
 * znaną ceną jest cena bieżąca.
 */
export function lowestPriceBeforeReduction(
  currentPrice: string,
  history: { price: string; recordedAt: Date }[],
  now = Date.now(),
): string {
  const current = toGrosze(currentPrice);
  const rows = [...history].sort((a, b) => a.recordedAt.getTime() - b.recordedAt.getTime());

  let i = rows.length;
  while (i > 0 && toGrosze(rows[i - 1].price) === current) i--;
  // i = index of the first row of the current-price run (rows.length when the
  // last recorded price differs, i.e. history lags behind: reduction is now).
  const reductionStart = i < rows.length ? rows[i].recordedAt.getTime() : now;
  const before = rows.slice(0, i);
  if (before.length === 0) return fromGrosze(current);

  const windowStart = reductionStart - WINDOW_MS;
  const candidates: number[] = [];
  let inForceAtWindowStart: number | null = null;
  for (const r of before) {
    const t = r.recordedAt.getTime();
    if (t < windowStart) inForceAtWindowStart = toGrosze(r.price);
    else candidates.push(toGrosze(r.price));
  }
  if (inForceAtWindowStart !== null) candidates.push(inForceAtWindowStart);
  return fromGrosze(Math.min(...candidates));
}

/**
 * Najniższa cena z 30 dni przed obniżką per produkt (Omnibus). Map
 * productId → cena; produkty bez żadnej historii są pomijane.
 */
export async function getLowestPrices30(
  items: { id: string; price: string }[],
): Promise<Map<string, string>> {
  if (items.length === 0) return new Map();
  try {
    const rows = await db
      .select({ productId: priceHistory.productId, price: priceHistory.price, recordedAt: priceHistory.recordedAt })
      .from(priceHistory)
      .where(inArray(priceHistory.productId, items.map((p) => p.id)))
      .orderBy(asc(priceHistory.productId), asc(priceHistory.recordedAt));

    const byProduct = new Map<string, { price: string; recordedAt: Date }[]>();
    for (const r of rows) {
      const list = byProduct.get(r.productId) ?? [];
      list.push({ price: r.price, recordedAt: r.recordedAt });
      byProduct.set(r.productId, list);
    }

    const result = new Map<string, string>();
    for (const p of items) {
      const history = byProduct.get(p.id);
      if (history?.length) result.set(p.id, lowestPriceBeforeReduction(p.price, history));
    }
    return result;
  } catch {
    return new Map();
  }
}
